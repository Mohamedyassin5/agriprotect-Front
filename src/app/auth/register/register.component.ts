import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  showPassword = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  isLoading = signal(false);

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._#\-])[A-Za-z\d@$!%*?&._\-#]{8,}$/)]],
    confirmPassword: ['', [Validators.required]],
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    phoneNumber: [''],
    address: [''],
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      // Must set the error on the control itself for easier template access
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

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formValue = { ...this.registerForm.value };
    delete formValue.confirmPassword;

    this.authService.register(formValue).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Account created successfully. Redirecting to login...');
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (err) => {
        const msg = typeof err?.error === 'string' ? err.error : (err?.error?.message || err?.message || 'Error occurred during registration');
        this.errorMessage.set(msg);
        this.isLoading.set(false);
      }
    });
  }
}
