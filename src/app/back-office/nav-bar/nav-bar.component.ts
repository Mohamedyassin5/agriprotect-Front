import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css'
})
export class NavBarComponent {
  private authService = inject(AuthService);
  userFullName = this.authService.getUserFullName();
  userEmail = this.authService.getUserEmail();

  navItems = [
    { title: 'Navigation', type: 'group' },
    { title: 'Dashboard', type: 'item', icon: 'feather icon-home', url: '/back-office/dashboard' },
    { title: 'Management', type: 'group' },
    { title: 'Users', type: 'item', icon: 'feather icon-users', url: '/back-office/users' },
    { title: 'Crops', type: 'item', icon: 'feather icon-layers', url: '/back-office/crops' },
    { title: 'Settings', type: 'item', icon: 'feather icon-settings', url: '/back-office/settings' }
  ];
}
