import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { CwToastStackComponent } from './components/cw-toast-stack.component';

@Component({
  selector: 'app-credit-workflow-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, CwToastStackComponent],
  templateUrl: './credit-workflow-shell.component.html',
  styleUrl: './credit-workflow-shell.component.css',
})
export class CreditWorkflowShellComponent {
  readonly auth = inject(AuthService);

  nav = [
    { label: 'Tableau crédit', path: '/back-office/credit', icon: 'grid', linkExact: true },
    { label: 'Demandes', path: '/back-office/credit/demandes', icon: 'file', linkExact: false },
    { label: 'Simulation', path: '/back-office/credit/simulation', icon: 'calc', linkExact: false },
  ];

  userName(): string {
    return this.auth.getUserFullName();
  }

  userEmail(): string {
    return this.auth.getUserEmail();
  }
}
