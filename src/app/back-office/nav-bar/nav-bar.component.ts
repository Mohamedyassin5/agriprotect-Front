import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css'
})
export class NavBarComponent implements OnInit {
  private authService = inject(AuthService);
  userFullName = this.authService.getUserFullName();
  userEmail = this.authService.getUserEmail();

  navItems: any[] = [];
  userRole = this.authService.getUserRole();

  ngOnInit() {
    const allItems = [
      { title: 'Navigation', type: 'group', roles: ['ADMIN'] },
      { title: 'Dashboard', type: 'item', icon: 'feather icon-home', url: '/back-office/dashboard', roles: ['ADMIN'] },
      { title: 'Management', type: 'group', roles: ['ADMIN', 'EXPERT'] },
      { title: 'Users', type: 'item', icon: 'feather icon-users', url: '/back-office/users', roles: ['ADMIN'] },
      { title: 'Crops', type: 'item', icon: 'feather icon-layers', url: '/back-office/crops', roles: ['ADMIN'] },
      { title: 'Solidarity Funds', type: 'item', icon: 'feather icon-shield', url: '/back-office/solidarity-funds', roles: ['ADMIN'] },
      { title: 'Indemnisations', type: 'item', icon: 'feather icon-file-text', url: '/back-office/indemnisation', roles: ['ADMIN'] },
      { title: 'Investigations', type: 'item', icon: 'feather icon-search', url: '/back-office/investigations', roles: ['ADMIN', 'EXPERT'] },
      { title: 'QCM Generator', type: 'item', icon: 'feather icon-cpu', url: '/back-office/qcm-generator', roles: ['ADMIN'] },
      { title: 'Settings', type: 'item', icon: 'feather icon-settings', url: '/back-office/settings', roles: ['ADMIN'] }
    ];

    this.navItems = allItems.filter(item => item.roles.includes(this.userRole || ''));
  }

  logout() {
    this.authService.logout();
  }
}
