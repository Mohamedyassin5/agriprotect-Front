import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { TopBarComponent } from './top-bar/top-bar.component';

@Component({
  selector: 'app-back-office',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavBarComponent, TopBarComponent],
  templateUrl: './back-office.component.html',
  styleUrl: './back-office.component.css',
  encapsulation: ViewEncapsulation.None
})
export class BackOfficeComponent {
  navCollapsed = false;

  toggleNav() {
    this.navCollapsed = !this.navCollapsed;
  }
}
