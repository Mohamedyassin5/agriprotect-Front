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
    { title: 'Users', type: 'item', icon: 'feather icon-users', url: '/back-office/users' },

   { title: 'Assurance', type: 'group' },
    { title: 'Dashboard',       type: 'item', icon: 'feather icon-pie-chart',      url: '/back-office/dashboard' },
    { title: 'Polices',         type: 'item', icon: 'feather icon-shield',         url: '/back-office/insurances' },
 { title: 'Remboursements',  type: 'item', icon: 'feather icon-corner-up-left',     url: '/back-office/remboursements' },
    { title: 'Tests Scheduler', type: 'item', icon: 'feather icon-zap',            url: '/back-office/scheduler-tests' },

    { title: 'Agronomie', type: 'group' },
    { title: 'Cultures Réf.',   type: 'item', icon: 'feather icon-layers',     url: '/back-office/crops' },

    { title: 'Système', type: 'group' },
    { title: 'Settings',        type: 'item', icon: 'feather icon-settings',   url: '/back-office/settings' }
  ];
}
