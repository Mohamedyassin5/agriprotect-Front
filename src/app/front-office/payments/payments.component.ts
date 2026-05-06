import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SolidarityFundService } from '../../core/services/solidarity-fund.service';
import { UserService } from '../profile/user.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
})
export class PaymentsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  private fundService = inject(SolidarityFundService);
  private userService = inject(UserService);

  fundId: string | null = null;
  fundName: string = '';
  amount: number = 0;
  
  cardNumber: string = '';
  expiryDate: string = '';
  cvv: string = '';
  cardHolder: string = '';

  processing = false;
  success = false;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.fundId = params['fundId'];
      this.amount = +params['amount'] || 0;
      this.fundName = params['fundName'] || 'Paiement AgriProtect';
    });
  }

  processPayment() {
    if (!this.fundId) return;
    
    this.processing = true;
    
    // 1. Create Real Stripe Payment Intent in Backend
    this.fundService.createPaymentIntent(this.amount + 0.5, this.fundId, this.fundName).subscribe({
      next: (response) => {
        console.log('Stripe Intent Created:', response.clientSecret);
        
        // 2. Complete the simulation (Finalize in DB)
        setTimeout(() => {
          this.fundService.payPrime(this.fundId!).subscribe({
            next: () => {
              this.processing = false;
              this.success = true;
              this.userService.loadProfile();
              
              setTimeout(() => {
                this.router.navigate(['/front-office/policies']);
              }, 4000);
            },
            error: (err) => {
              const message = err.error?.message || err.error || 'Paiement échoué';
              alert('⚠️ ' + message);
              this.processing = false;
            }
          });
        }, 1500);
      },
      error: (err) => {
        const message = err.error?.message || err.error || 'Impossible d\'initialiser le paiement.';
        alert('❌ Stripe: ' + message);
        this.processing = false;
      }
    });
  }

  formatCardNumber() {
    this.cardNumber = this.cardNumber.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
  }

  formatExpiry() {
    this.expiryDate = this.expiryDate.replace(/\D/g, '').replace(/(.{2})/, '$1/').substring(0, 5);
  }
}
