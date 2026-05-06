import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../front-office/profile/user.service';

@Component({
  selector: 'app-user-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-stats.component.html',
  styleUrls: ['./user-stats.component.css']
})
export class UserStatsComponent implements OnInit {
  private userService = inject(UserService);

  totalUsers = signal<number>(0);
  avgTrustScore = signal<number>(0);
  activeUsers = signal<number>(0);

  ngOnInit(): void {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        const users = Array.isArray(data) ? data : (data as any).content || [];
        
        this.totalUsers.set(users.length);
        
        const totalScore = users.reduce((acc: number, user: any) => acc + (user.score || 0), 0);
        this.avgTrustScore.set(users.length > 0 ? Math.round(totalScore / users.length) : 0);
        
        const active = users.filter((user: any) => user.status === 'ACTIVE').length;
        this.activeUsers.set(active);
      },
      error: (err) => console.error('Error fetching user stats:', err)
    });
  }
}
