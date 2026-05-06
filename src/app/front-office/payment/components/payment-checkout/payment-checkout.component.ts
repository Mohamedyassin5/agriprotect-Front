import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { PaymentResponse, StripeApproach } from '../../models/payment.models';

declare var Stripe: any;

@Component({
  selector: 'app-payment-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-checkout.component.html',
  styleUrls: ['./payment-checkout.component.css']
})
export class PaymentCheckoutComponent implements OnInit, OnDestroy {

  @ViewChild('cardElement') cardElementRef!: ElementRef;

  insuranceId!: string;
  isRegularization = false;
  paymentData: PaymentResponse | null = null;

  // UI state
  loading = true;
  processing = false;
  error: string | null = null;
  activeApproach: StripeApproach = 'embedded';

  // Stripe.js objects
  private stripe: any = null;
  private cardElement: any = null;
  private stripeInitialized = false;

  readonly STRIPE_PK = 'pk_test_51T4idXJ018n6rsEMLPU6Lc5Y1q2DBS84sFxSgoF42rFpRdC7wbn6a5J00AuSHj6EUGhg1NhV6fJmk7HRZzsCcqw500iOqlX3dM'; // ← Remplacer par ta clé publique

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.insuranceId = this.route.snapshot.paramMap.get('insuranceId')!;
    // Support both route data (from routes config) and query param (from dashboard modal)
    this.isRegularization =
      !!this.route.snapshot.data['isRegularization'] ||
      this.route.snapshot.queryParamMap.get('regularization') === 'true';
    this.initPayment();
  }

  // ── STEP 1 : Appeler le backend pour obtenir le clientSecret ────────
  initPayment(): void {
    this.loading = true;
    this.error = null;

    const call = this.isRegularization
      ? this.paymentService.initiateRegularizationPayment(this.insuranceId)
      : this.paymentService.initiatePayment(this.insuranceId);

    call.subscribe({
      next: data => {
        this.paymentData = data;
        this.loading = false;
        // Charger Stripe.js dynamiquement puis monter le formulaire
        this.loadStripeJs().then(() => {
          if (this.activeApproach === 'embedded') {
            setTimeout(() => this.mountStripeCard(), 100);
          }
        });
      },
      error: err => {
        this.error = err?.error?.message || 'Impossible d\'initier le paiement.';
        this.loading = false;
      }
    });
  }

  // ── Charger le script Stripe.js dynamiquement ────────────────────
  loadStripeJs(): Promise<void> {
    return new Promise(resolve => {
      if ((window as any).Stripe) {
        this.stripe = Stripe(this.STRIPE_PK);
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => {
        this.stripe = Stripe(this.STRIPE_PK);
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  // ── APPROACH 1 : Stripe.js Elements (formulaire intégré) ────────────
  mountStripeCard(): void {
    if (!this.stripe || !this.cardElementRef?.nativeElement || this.stripeInitialized) return;
    const elements = this.stripe.elements();
    this.cardElement = elements.create('card', {
      style: {
        base: {
          color: '#111827',
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '16px',
          '::placeholder': { color: '#9ca3af' }
        },
        invalid: { color: '#ef4444' }
      }
    });
    this.cardElement.mount(this.cardElementRef.nativeElement);
    this.stripeInitialized = true;
  }

  async payWithStripeJs(): Promise<void> {
    if (!this.stripe || !this.cardElement || !this.paymentData) return;
    this.processing = true;
    this.error = null;

    const { error, paymentIntent } = await this.stripe.confirmCardPayment(
      this.paymentData.clientSecret,
      { payment_method: { card: this.cardElement } }
    );

    if (error) {
      this.error = error.message;
      this.processing = false;
    } else if (paymentIntent?.status === 'succeeded') {
      this.router.navigate(['/front-office/payment/success'], {
        queryParams: {
          intentId: paymentIntent.id,
          policy: this.paymentData.policyNumber,
          amount: this.paymentData.totalAmount
        }
      });
    }
  }

  // ── APPROACH 2 : Stripe Checkout (redirect vers page Stripe) ────────
  async redirectToStripeCheckout(): Promise<void> {
    if (!this.stripe || !this.paymentData) return;
    this.processing = true;
    this.error = null;

    // Avec Stripe Checkout on utilise le clientSecret pour confirmer
    // ou bien on redirige directement si le backend génère une Checkout Session
    // Ici on utilise confirmPayment() avec return_url
    const { error } = await this.stripe.confirmPayment({
      clientSecret: this.paymentData.clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/front-office/payment/success?policy=${this.paymentData.policyNumber}`
      }
    });

    if (error) {
      this.error = error.message;
      this.processing = false;
    }
    // Si succès, Stripe redirige automatiquement vers return_url
  }

  switchApproach(approach: StripeApproach): void {
    this.activeApproach = approach;
    this.error = null;
    if (approach === 'embedded') {
      this.stripeInitialized = false;
      setTimeout(() => this.mountStripeCard(), 100);
    }
  }

  ngOnDestroy(): void {
    this.cardElement?.destroy();
  }

  get pageTitle(): string {
    return this.isRegularization ? 'Régularisation de police' : 'Paiement de prime';
  }

  get pageIcon(): string {
    return this.isRegularization ? '🔄' : '💳';
  }
}