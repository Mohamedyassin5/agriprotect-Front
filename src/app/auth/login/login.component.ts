import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  showPassword = signal(false);
  errorMessage = signal('');
  isLoading = signal(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        if (res.token) {
          this.authService.saveToken(res.token);
          
          // Redirect based on role
          const role = this.authService.getUserRole();
          
          if (role === 'ADMIN') {
            this.router.navigate(['/back-office']);
          } else if (role === 'EXPERT') {
            this.router.navigate(['/back-office/investigations']);
          } else {
            // Default to front-office for FARMER or unknown
            this.router.navigate(['/front-office']);
          }
        } else {
           this.errorMessage.set('Unexpected response format');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        const errorDetail = err?.error?.message || (typeof err?.error === 'string' ? err.error : null);
        this.errorMessage.set(errorDetail || err?.message || 'Invalid email or password');
        this.isLoading.set(false);
      }
    });
  }
}
