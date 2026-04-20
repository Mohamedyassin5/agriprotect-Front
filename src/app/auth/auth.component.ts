import { 
  Component, 
  OnInit, 
  AfterViewInit, 
  ElementRef, 
  ViewChild 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  ReactiveFormsModule, 
  FormBuilder, 
  FormGroup, 
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from './auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit, AfterViewInit {
  @ViewChild('bgVideo') bgVideo!: ElementRef<HTMLVideoElement>;

  activeTab: 'signin' | 'signup' = 'signin';
  loginForm: FormGroup;
  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  loginError = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{8,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.route.url.subscribe(url => {
      const path = url[0]?.path;
      if (path === 'register') {
        this.activeTab = 'signup';
      } else {
        this.activeTab = 'signin';
      }
    });
  }

  ngAfterViewInit(): void {
    const video = this.bgVideo?.nativeElement;
    if (video) {
        video.muted = true;
        video.play().catch(e => console.warn('Auth video play failed:', e));
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  setTab(tab: 'signin' | 'signup'): void {
    const path = tab === 'signin' ? '/login' : '/register';
    this.router.navigate([path]);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  close(): void {
    this.router.navigate(['/']);
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      this.loginError = '';
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          if (response && response.token) {
            this.authService.saveToken(response.token);
            
            // Redirect based on role
            const role = this.authService.getUserRole();
            
            if (role === 'ADMIN') {
              this.router.navigate(['/back-office']);
            } else {
              // Default to front-office for FARMER or unknown
              this.router.navigate(['/front-office']);
            }
          }
        },
        error: (err) => {
          console.error('Login error', err);
          this.loginError = 'Invalid email or password.';
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  onRegister(): void {
    if (this.registerForm.valid) {
      console.log('Register attempt:', this.registerForm.value);
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  isFieldInvalid(form: FormGroup, field: string): boolean {
    const control = form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
