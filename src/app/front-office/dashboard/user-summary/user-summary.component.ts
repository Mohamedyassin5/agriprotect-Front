import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../profile/user.service';
import { CropService } from '../../crops/crop.service';
import { AuthService } from '../../../auth/auth.service';
import { SolidarityFundService } from '../../../core/services/solidarity-fund.service';
import { QcmService } from '../../../core/services/qcm.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-user-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-summary.component.html',
  styleUrl: './user-summary.component.css'
})
export class UserSummaryComponent implements OnInit {
  private userService = inject(UserService);
  private cropService = inject(CropService);
  private authService = inject(AuthService);
  private fundService = inject(SolidarityFundService);
  private qcmService = inject(QcmService);

  user = this.userService.currentUserProfile;
  cropCount: number = 0;
  membershipCount: number = 0;
  availableTestsCount: number = 0;
  isLoading: boolean = true;

  userProfileImage = computed(() => {
    const profile = this.user();
    if (profile?.profileImage) {
      return `http://localhost:8081/agri/uploads/profiles/${profile.profileImage}`;
    }
    return 'assets/img/default-avatar.png';
  });

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    
    if (!userId) {
      this.isLoading = false;
      return;
    }

    // Fetch profile, crops, memberships, and available tests in parallel
    forkJoin({
      profile: this.user() ? of(this.user()) : this.userService.getMyProfile().pipe(catchError(() => of(null))),
      crops: this.cropService.getUserCrops(userId).pipe(catchError(() => of([]))),
      memberships: this.fundService.getMyMemberships().pipe(catchError(() => of([]))),
      tests: this.qcmService.getAvailableTests().pipe(catchError(() => of([])))
    }).subscribe({
      next: (result) => {
        if (result.profile && !this.user()) {
          this.userService.currentUserProfile.set(result.profile);
        }
        this.cropCount = result.crops ? result.crops.length : 0;
        this.membershipCount = result.memberships ? result.memberships.length : 0;
        this.availableTestsCount = result.tests ? result.tests.length : 0;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching dashboard summary data', err);
        this.isLoading = false;
      }
    });
  }

}
