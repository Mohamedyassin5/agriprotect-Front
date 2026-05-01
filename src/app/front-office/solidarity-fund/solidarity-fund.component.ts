import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SolidarityFundService, SolidarityFund } from '../../core/services/solidarity-fund.service';
import { IndemnisationService } from '../../core/services/indemnisation.service';

@Component({
  selector: 'app-solidarity-fund',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './solidarity-fund.component.html',
  styleUrls: ['./solidarity-fund.component.css']
})
export class SolidarityFundComponent implements OnInit {
  private fundService = inject(SolidarityFundService);
  private indemnisationService = inject(IndemnisationService);
  private router = inject(Router);

  funds: SolidarityFund[] = [];
  myMemberships: any[] = [];
  loading = true;
  activeTab: 'browse' | 'memberships' = 'browse';
  joining: string | null = null;
  paying: string | null = null;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.fundService.getAllFunds().subscribe({
      next: (funds) => {
        this.funds = funds;
        this.loadMemberships();
      },
      error: () => { this.loading = false; }
    });
  }

  loadMemberships() {
    this.indemnisationService.getMyMemberships().subscribe({
      next: (memberships) => {
        this.myMemberships = memberships;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  isMember(fundId: string): boolean {
    return this.myMemberships.some(m => m.solidarityFund?.id === fundId);
  }

  getMembershipInfo(fundId: string): any {
    return this.myMemberships.find(m => m.solidarityFund?.id === fundId) || {};
  }

  joinFund(fundId: string) {
    this.joining = fundId;
    this.fundService.joinFund(fundId).subscribe({
      next: () => {
        this.joining = null;
        this.loadData();
      },
      error: (err) => {
        alert('Erreur: ' + (err.error || 'Impossible de rejoindre le fonds'));
        this.joining = null;
      }
    });
  }

  payPrime(fundId: string) {
    const info = this.getMembershipInfo(fundId);
    let amount = info.currentPrimeAmount || 0;
    
    // Apply discount if exists
    if (info.discountPercentage > 0) {
      amount = amount * (1 - (info.discountPercentage / 100));
    }
    
    const name = info.solidarityFund?.name || 'Fonds de Solidarité';

    this.router.navigate(['/front-office/payments'], {
      queryParams: {
        fundId: fundId,
        amount: amount,
        fundName: name
      }
    });
  }
}

