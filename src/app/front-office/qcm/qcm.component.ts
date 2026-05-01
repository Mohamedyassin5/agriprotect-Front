import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QcmService, QcmTest, QcmQuestion } from '../../core/services/qcm.service';

@Component({
  selector: 'app-qcm',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qcm.component.html',
  styleUrls: ['./qcm.component.css']
})
export class QcmComponent implements OnInit {
  private qcmService = inject(QcmService);

  availableTests: QcmTest[] = [];
  loading = true;

  activeTest: QcmTest | null = null;
  questions: QcmQuestion[] = [];
  answers: { [questionId: string]: string } = {};
  myResults: any[] = [];
  
  submitting = false;
  testResult: string | null = null;

  get progressPercentage(): number {
    if (this.questions.length === 0) return 0;
    const answered = Object.keys(this.answers).length;
    return (answered / this.questions.length) * 100;
  }

  ngOnInit() {
    this.loadAvailableTests();
  }

  loadAvailableTests() {
    this.loading = true;
    this.qcmService.getAvailableTests().subscribe({
      next: (tests) => {
        this.availableTests = tests;
        this.loadMyResults();
      },
      error: (err) => {
        console.error('Error loading tests', err);
        this.loading = false;
      }
    });
  }

  loadMyResults() {
    this.qcmService.getMyResults().subscribe({
      next: (results) => {
        this.myResults = results;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  isTestPassed(testId: string): boolean {
    return this.myResults.some(r => r.test?.id === testId && r.passed);
  }

  startTest(test: QcmTest) {
    this.activeTest = test;
    this.loading = true;
    this.testResult = null;
    this.answers = {};

    this.qcmService.getTestQuestions(test.id).subscribe({
      next: (questions) => {
        this.questions = questions;
        this.loading = false;
      },
      error: (err) => {
        alert('Erreur lors du chargement des questions');
        this.activeTest = null;
        this.loading = false;
      }
    });
  }

  selectOption(questionId: string, option: string) {
    this.answers[questionId] = option;
  }

  isOptionSelected(questionId: string, option: string): boolean {
    return this.answers[questionId] === option;
  }

  canSubmit(): boolean {
    // Check if all questions are answered
    return this.questions.length > 0 && 
           Object.keys(this.answers).length === this.questions.length;
  }

  submitTest() {
    if (!this.activeTest) return;
    
    this.submitting = true;
    this.qcmService.submitTest(this.activeTest.id, this.answers).subscribe({
      next: (res) => {
        this.testResult = res;
        this.submitting = false;
      },
      error: (err) => {
        alert('Erreur: ' + (err.error || 'Impossible de soumettre le test'));
        this.submitting = false;
      }
    });
  }

  backToList() {
    this.activeTest = null;
    this.questions = [];
    this.answers = {};
    this.testResult = null;
    this.loadAvailableTests(); // Refresh in case they passed and get a discount
  }
}
