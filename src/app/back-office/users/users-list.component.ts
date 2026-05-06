import { Component, OnInit, inject, signal, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../front-office/profile/user.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css',
  encapsulation: ViewEncapsulation.None
})
export class UsersListComponent implements OnInit {
  private userService = inject(UserService);

  users = signal<any[]>([]);
  searchTerm = signal('');
  isLoading = signal(true);
  errorMessage = signal('');
  selectedUser = signal<any>(null);
  userToDelete = signal<any>(null);

  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.users();
    
    return this.users().filter(u => 
      (u.firstName?.toLowerCase() || '').includes(term) ||
      (u.lastName?.toLowerCase() || '').includes(term) ||
      (u.email?.toLowerCase() || '').includes(term)
    );
  });

  activeUsersCount = computed(() => 
    this.users().filter(u => u.status === 'ACTIVE').length
  );

  inactiveUsersCount = computed(() => 
    this.users().filter(u => u.status !== 'ACTIVE').length
  );

  ngOnInit() {
    this.fetchUsers();
  }

  fetchUsers() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.userService.getAllUsers().subscribe({
      next: (data) => {
        console.log('DEBUG: Received users data:', data);
        const userArray = Array.isArray(data) ? data : (data as any).content || [];
        this.users.set(userArray);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('API ERROR in UsersListComponent:', err);
        this.errorMessage.set(`${err.status} ${err.statusText}: ${err.message}`);
        this.isLoading.set(false);
      }
    });
  }

  onSearch(event: any) {
    this.searchTerm.set(event.target.value);
  }

  getInitials(user: any) {
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  }

  getTrustColor(score: number) {
    if (score > 80) return '#52B788';
    if (score > 50) return '#74C69D';
    return '#95D5B2';
  }

  openDetail(user: any) {
    this.selectedUser.set(user);
  }

  closeDetail() {
    this.selectedUser.set(null);
  }

  toggleStatus(user: any) {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.userService.toggleUserStatus(user.id, newStatus).subscribe({
      next: () => {
        // Update local state
        const updated = this.users().map(u => 
          u.id === user.id ? { ...u, status: newStatus } : u
        );
        this.users.set(updated);
        // Also update the selected user in drawer if open
        if (this.selectedUser()?.id === user.id) {
          this.selectedUser.set({ ...user, status: newStatus });
        }
      },
      error: (err) => {
        console.error('Toggle status failed:', err);
      }
    });
  }

  confirmDelete(user: any) {
    this.userToDelete.set(user);
  }

  cancelDelete() {
    this.userToDelete.set(null);
  }

  deleteUser() {
    const user = this.userToDelete();
    if (!user) return;

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.users.set(this.users().filter(u => u.id !== user.id));
        this.userToDelete.set(null);
        if (this.selectedUser()?.id === user.id) {
          this.selectedUser.set(null);
        }
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.userToDelete.set(null);
      }
    });
  }
}
