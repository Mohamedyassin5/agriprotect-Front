import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.css'
})
export class TopBarComponent {
  @Output() navCollapse = new EventEmitter();
  private authService = inject(AuthService);
  userFullName = this.authService.getUserFullName();
  userEmail = this.authService.getUserEmail();
  profileDropdownOpen = false;

  toggleDropdown() {
    this.profileDropdownOpen = !this.profileDropdownOpen;
  }

  toggleNav() {
    this.navCollapse.emit();
  }

  onLogout() {
    this.authService.logout();
  }
}

