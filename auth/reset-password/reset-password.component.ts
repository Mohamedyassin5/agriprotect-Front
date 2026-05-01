import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  showPassword = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  isLoading = signal(false);
  
  email = '';
  code = '';

  resetForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._#\-])[A-Za-z\d@$!%*?&._\-#]{8,}$/)]],
    confirmNewPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state?.['email'] && navigation?.extras.state?.['code']) {
      this.email = navigation.extras.state['email'];
      this.code = navigation.extras.state['code'];
    } else {
      this.router.navigate(['/auth/forgot-password']);
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('newPassword');
    const confirmPassword = control.get('confirmNewPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      if (confirmPassword.errors == null) {
        confirmPassword.setErrors({ passwordMismatch: true });
      } else {
        confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
      }
      return { passwordMismatch: true };
    } else {
      if (confirmPassword?.hasError('passwordMismatch')) {
        let errs = { ...confirmPassword.errors };
        delete errs['passwordMismatch'];
        confirmPassword.setErrors(Object.keys(errs).length ? errs : null);
      }
    }
    return null;
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  getPasswordStrength(): string {
    const pwd = this.resetForm.get('newPassword')?.value || '';
    if (!pwd) return '';
    let strength = 0;
    if (pwd.length > 7) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[@$!%*?&._#\-]/.test(pwd)) strength++;
    
    if (strength < 2) return 'weak';
    if (strength === 2 || strength === 3) return 'medium';
    return 'strong';
  }

  onSubmit() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const payload = {
      email: this.email,
      code: this.code,
      newPassword: this.resetForm.value.newPassword,
      confirmNewPassword: this.resetForm.value.confirmNewPassword
    };

    this.authService.resetPassword(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Password reset successfully. Redirecting to login...');
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(typeof err?.error === 'string' ? err.error : (err?.error?.message || err?.message || 'Error resetting password'));
      }
    });
  }
}
