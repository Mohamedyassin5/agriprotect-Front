import { Component, ElementRef, QueryList, ViewChildren, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormArray, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-verify-code',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './verify-code.component.html',
  styleUrl: './verify-code.component.css'
})
export class VerifyCodeComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  @ViewChildren('codeInputs') codeInputs!: QueryList<ElementRef>;
  
  email = '';
  errorMessage = signal('');
  successMessage = signal('');
  isLoading = signal(false);

  verifyForm = this.fb.group({
    digits: this.fb.array(
      [...Array(6)].map(() => new FormControl('', [Validators.required, Validators.pattern(/^[0-9A-Za-z]$/)]))
    )
  });

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state?.['email']) {
      this.email = navigation.extras.state['email'];
      localStorage.setItem('resetEmail', this.email);
    } else {
      this.email = localStorage.getItem('resetEmail') || '';
    }

    if (!this.email) {
      this.router.navigate(['/auth/forgot-password']);
    }
  }

  get digitsArr() {
    return this.verifyForm.get('digits') as FormArray;
  }

  onInput(event: any, index: number) {
    const input = event.target;
    if (input.value && index < 5) {
      this.codeInputs.toArray()[index + 1].nativeElement.focus();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.digitsArr.at(index).value && index > 0) {
      this.codeInputs.toArray()[index - 1].nativeElement.focus();
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text');
    if (pastedData) {
      const chars = pastedData.trim().substring(0, 6).split('');
      chars.forEach((char, index) => {
        if (index < 6) {
          this.digitsArr.at(index).setValue(char);
        }
      });
      const nextFocus = Math.min(chars.length, 5);
      if (nextFocus < 6) {
        this.codeInputs.toArray()[nextFocus].nativeElement.focus();
      }
    }
  }

  resendCode() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Code resent successfully.');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Failed to resend code. ' + (err?.error?.message || err?.error || err?.message || ''));
      }
    });
  }

  onSubmit() {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }
    
    const code = this.digitsArr.value.join('');
    this.router.navigate(['/auth/reset-password'], { state: { email: this.email, code: code } });
  }
}
