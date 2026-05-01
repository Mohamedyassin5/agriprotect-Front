import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QcmService, QcmTest } from '../../core/services/qcm.service';
import { SolidarityFundService, SolidarityFund } from '../../core/services/solidarity-fund.service';

@Component({
  selector: 'app-qcm-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qcm-management.component.html',
  styleUrls: ['./qcm-management.component.css']
})
export class QcmManagementComponent implements OnInit {
  private qcmService = inject(QcmService);
  private fundService = inject(SolidarityFundService);

  activeTests: QcmTest[] = [];
  funds: SolidarityFund[] = [];
  loading = true;
  generatingId: string | null = null;
  selectedTest: QcmTest | null = null;

  selectedFundId: string = '';

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    
    // Load funds for the dropdown
    this.fundService.getAllFunds().subscribe({
      next: (funds) => {
        this.funds = funds;
        this.loadTests();
      },
      error: (err) => {
        console.error('Error loading funds', err);
        this.loading = false;
      }
    });
  }

  loadTests() {
    this.qcmService.getAvailableTests().subscribe({
      next: (tests) => {
        this.activeTests = tests;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading tests', err);
        this.loading = false;
      }
    });
  }

  generateAiTest() {
    if (!this.selectedFundId) {
      alert('Veuillez sélectionner un fonds de solidarité.');
      return;
    }

    this.generatingId = this.selectedFundId;

    this.qcmService.generateTestForFund(this.selectedFundId).subscribe({
      next: (res) => {
        alert("Nouveau test QCM généré par l'IA avec succès !");
        this.selectedFundId = '';
        this.loadData();
        this.generatingId = null;
      },
      error: (err) => {
        alert('Erreur lors de la génération: ' + (err.error || 'Vérifiez la connexion au service IA.'));
        this.generatingId = null;
      }
    });
  }
}
