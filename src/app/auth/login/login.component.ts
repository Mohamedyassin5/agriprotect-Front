import { Component, inject, signal, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { GoogleSigninButtonModule, SocialAuthService, FacebookLoginProvider } from '@abacritt/angularx-social-login';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule, GoogleSigninButtonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private socialAuthService = inject(SocialAuthService);

  showPassword = signal(false);
  errorMessage = signal('');
  isLoading = signal(false);
  
  loginMode = signal<'credentials' | 'face'>('credentials');

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  stream: MediaStream | null = null;

  ngOnInit() {
    this.socialAuthService.authState.subscribe((user: any) => {
      if (user) {
        console.log('Social Auth User:', user);
        this.isLoading.set(true);

        if (user.provider === 'GOOGLE' && user.idToken) {
          this.authService.loginWithGoogle(user.idToken).subscribe({
            next: (res) => this.handleSocialLoginSuccess(res),
            error: (err) => this.handleSocialLoginError(err)
          });
        } else if (user.provider === 'FACEBOOK' && user.authToken) {
          this.authService.loginWithFacebook(user.authToken).subscribe({
            next: (res) => this.handleSocialLoginSuccess(res),
            error: (err) => this.handleSocialLoginError(err)
          });
        }
      }
    });
  }

  signInWithFB(): void {
    this.socialAuthService.signIn(FacebookLoginProvider.PROVIDER_ID);
  }

  private handleSocialLoginSuccess(res: any) {
    this.authService.saveToken(res.token);
    this.router.navigate(['/front-office']);
    this.isLoading.set(false);
  }

  private handleSocialLoginError(err: any) {
    console.error('Social login error', err);
    this.errorMessage.set('Social login failed. Please try again.');
    this.isLoading.set(false);
  }

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  setLoginMode(mode: 'credentials' | 'face') {
    this.loginMode.set(mode);
    this.errorMessage.set('');
    if (mode === 'face') {
      this.initCamera();
    } else {
      this.stopCamera();
    }
  }

  async initCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
      });
      setTimeout(() => {
        if (this.videoElement) {
          this.videoElement.nativeElement.srcObject = this.stream;
        }
      }, 0);
    } catch (err) {
      this.errorMessage.set('Camera access denied or unavailable.');
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  captureAndLogin() {
    if (!this.loginForm.get('email')?.value) {
      this.errorMessage.set('Please enter your email to find your biometric profile.');
      this.loginForm.get('email')?.markAsTouched();
      return;
    }

    if (!this.videoElement || !this.canvasElement) return;
    
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;

    // Ensure the video is actually streaming frames
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      this.errorMessage.set('Camera is still initializing. Please wait a moment and try again.');
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (!blob) {
        this.errorMessage.set('Capture failed.');
        return;
      }
      const file = new File([blob], 'face.jpg', { type: 'image/jpeg' });
      const email = this.loginForm.get('email')?.value || '';
      
      this.isLoading.set(true);
      this.errorMessage.set('');

      this.authService.faceLogin(email, file).subscribe({
        next: (res) => {
          if (res.token) {
            this.authService.saveToken(res.token);
            const role = this.authService.getUserRole();
            if (role === 'ADMIN') {
              this.router.navigate(['/back-office']);
            } else {
              this.router.navigate(['/front-office']);
            }
          } else {
             this.errorMessage.set('Unexpected response format');
          }
          this.isLoading.set(false);
          this.stopCamera();
        },
        error: (err) => {
          const errorDetail = err?.error?.message || (typeof err?.error === 'string' ? err.error : null);
          this.errorMessage.set(errorDetail || err?.message || 'Biometric verification failed.');
          this.isLoading.set(false);
        }
      });
    }, 'image/jpeg', 0.95);
  }

  ngOnDestroy() {
    this.stopCamera();
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
