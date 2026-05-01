import { Component, Output, EventEmitter, inject } from '@angular/core';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.css'
})
export class TopBarComponent {
  @Output() navCollapse = new EventEmitter();
  private authService = inject(AuthService);
  userFullName = this.authService.getUserFullName();
  userEmail = this.authService.getUserEmail();

  showUserDropdown = false;
  showNotificationDropdown = false;

  toggleNav() {
    this.navCollapse.emit();
  }

  toggleUserDropdown() {
    this.showUserDropdown = !this.showUserDropdown;
    if (this.showUserDropdown) this.showNotificationDropdown = false;
  }

  toggleNotificationDropdown() {
    this.showNotificationDropdown = !this.showNotificationDropdown;
    if (this.showNotificationDropdown) this.showUserDropdown = false;
  }

  logout() {
    this.authService.logout();
  }
}
