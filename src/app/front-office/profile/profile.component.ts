import { Component, OnInit, signal, inject, ViewChild, ElementRef, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { UserService } from './user.service';
import { gsap } from 'gsap';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  activeTab = signal<'personal' | 'security' | 'face'>('personal');
  
  isLoading = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  // Use standard signals from service
  userProfile = this.userService.currentUserProfile;

  userProfileImage = computed(() => {
    const profile = this.userProfile();
    if (profile?.profileImage) {
      // Use the new endpoint we created in the backend
      return `http://localhost:8081/agri/users/images/${profile.profileImage}`;
    }
    return null;
  });

  userInitials = computed(() => {
    const user = this.userProfile();
    if (!user) return '?';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  });

  trustLevel = computed(() => {
    const score = this.userProfile()?.score || 0;
    if (score > 80) return { label: 'Elite', color: '#52B788' };
    if (score > 50) return { label: 'Verified', color: '#74C69D' };
    return { label: 'Standard', color: '#95D5B2' };
  });


  personalForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    phoneNumber: [''],
    address: ['']
  });

  securityForm = this.fb.group({
    oldPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._#\-])[A-Za-z\d@$!%*?&._\-#]{8,}$/)]],
    confirmNewPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  // Face webcam elements
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  stream: MediaStream | null = null;
  faceLoading = signal(false);
  faceSuccess = signal('');
  faceError = signal('');
  isReenrolling = signal(false);

  showEnrollmentForm = computed(() => {
    const user = this.userProfile();
    if (!user) return false;
    return !user.faceEnabled || this.isReenrolling();
  });

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading.set(true);
    this.userService.getMyProfile().subscribe({
      next: (user) => {
        this.userService.currentUserProfile.set(user);
        this.personalForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          address: user.address
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMsg.set('Failed to load profile.');
        this.isLoading.set(false);
      }
    });
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
    }
    return null;
  }

  setTab(tab: 'personal' | 'security' | 'face') {
    if (this.activeTab() === tab) return;

    // Animate out
    gsap.to('.tab-pane', {
      opacity: 0,
      y: 10,
      duration: 0.2,
      onComplete: () => {
        this.activeTab.set(tab);
        this.clearMessages();
        
        // Animate in
        setTimeout(() => {
          gsap.fromTo('.tab-pane', 
            { opacity: 0, y: -10 },
            { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
          );
        }, 0);

        if (tab === 'face') {
          this.initCamera();
        } else {
          this.stopCamera();
        }
      }
    });
  }

  clearMessages() {
    this.successMsg.set('');
    this.errorMsg.set('');
    this.faceSuccess.set('');
    this.faceError.set('');
    this.isReenrolling.set(false);
  }

  onPersonalSubmit() {
    if (this.personalForm.invalid) return;
    if (!this.userProfile()?.id) return;

    this.isLoading.set(true);
    const req = {
      ...this.personalForm.value,
      score: this.userProfile()?.score || 50.0
    };

    this.userService.updateProfile(this.userProfile()?.id, req).subscribe({
      next: (updated) => {
        this.userService.currentUserProfile.set(updated);
        this.successMsg.set('Profile updated successfully.');
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMsg.set('Failed to update profile.');
        this.isLoading.set(false);
      }
    });
  }

  // --- Profile Image Upload ---

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file || !this.userProfile()?.id) return;

    this.isLoading.set(true);
    this.userService.uploadProfileImage(this.userProfile()?.id, file).subscribe({
      next: (updated) => {
        this.userService.currentUserProfile.set(updated);
        this.successMsg.set('Profile image updated!');
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMsg.set('Upload failed: ' + (err.error?.message || 'Error'));
        this.isLoading.set(false);
      }
    });
  }

  onSecuritySubmit() {
    if (this.securityForm.invalid) return;
    
    this.isLoading.set(true);
    const req = {
      oldPassword: this.securityForm.value.oldPassword,
      newPassword: this.securityForm.value.newPassword,
      confirmNewPassword: this.securityForm.value.confirmNewPassword
    };

    this.userService.changePassword(req).subscribe({
      next: (res) => {
        this.successMsg.set(res || 'Password changed successfully.');
        this.securityForm.reset();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMsg.set(typeof err?.error === 'string' ? err.error : 'Failed to change password.');
        this.isLoading.set(false);
      }
    });
  }

  // --- Face Recognition ---
  
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
      this.faceError.set('Camera access denied or unavailable.');
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  captureAndEnroll() {
    if (!this.videoElement || !this.canvasElement) return;
    
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (!blob) {
        this.faceError.set('Capture failed. blob null.');
        return;
      }
      const file = new File([blob], 'face.jpg', { type: 'image/jpeg' });
      
      this.faceLoading.set(true);
      this.userService.enrollFace(file).subscribe({
        next: (res) => {
          this.faceSuccess.set(res || 'Face enrolled successfully!');
          this.faceLoading.set(false);
          const current = this.userService.currentUserProfile();
          if (current) this.userService.currentUserProfile.set({ ...current, faceEnabled: true });
        },
        error: (err) => {
          this.faceError.set(typeof err?.error === 'string' ? err.error : 'Face enrollment failed.');
          this.faceLoading.set(false);
        }
      });
    }, 'image/jpeg', 0.95);
  }

  onFaceFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    this.faceLoading.set(true);
    this.userService.enrollFace(file).subscribe({
      next: (res) => {
        this.faceSuccess.set(res || 'Face enrolled successfully from photo!');
        this.faceLoading.set(false);
        const current = this.userService.currentUserProfile();
        if (current) this.userService.currentUserProfile.set({ ...current, faceEnabled: true });
      },
      error: (err) => {
        this.faceError.set(typeof err?.error === 'string' ? err.error : 'Face enrollment failed.');
        this.faceLoading.set(false);
      }
    });
  }

  ngOnDestroy() {
    this.stopCamera();
  }
}
