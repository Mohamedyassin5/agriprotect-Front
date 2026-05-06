import { Component, Input, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../profile/user.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html'
})
export class TopbarComponent implements OnInit {
  @Input() isSidebarCollapsed = false;

  private userService = inject(UserService);

  userProfile = this.userService.currentUserProfile;

  userProfileImage = computed(() => {
    const profile = this.userProfile();
    if (profile?.profileImage) {
      return `http://localhost:8081/agri/users/images/${profile.profileImage}`;
    }
    return null;
  });

  userInitials = computed(() => {
    const user = this.userProfile();
    if (!user) return 'AF';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  });

  ngOnInit() {
    if (!this.userProfile()) {
      this.userService.loadProfile();
    }
  }
}
