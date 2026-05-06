import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);

  user = {
    fullName: '',
    email: '',
    role: '',
    avatar: 'assets/images/user/avatar-1.jpg' // Default avatar
  };

  ngOnInit() {
    this.user.fullName = this.authService.getUserFullName();
    this.user.email = this.authService.getUserEmail();
    this.user.role = this.authService.getUserRole() || 'UTILISATEUR';
  }

  onUpdateProfile() {
    alert('Fonctionnalité de mise à jour bientôt disponible !');
  }
}
