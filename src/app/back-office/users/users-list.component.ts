import { Component, OnInit, inject, signal, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../front-office/profile/user.service';
import { SolidarityFundService } from '../../core/services/solidarity-fund.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css',
  encapsulation: ViewEncapsulation.None
})
export class UsersListComponent implements OnInit {
  private userService = inject(UserService);
  private fundService = inject(SolidarityFundService);

  users = signal<any[]>([]);
  funds = signal<any[]>([]);
  searchTerm = signal('');
  isLoading = signal(true);
  errorMessage = signal('');
  selectedUser = signal<any>(null);
  
  showForm = signal(false);
  isSubmitting = signal(false);
  userForm: FormGroup;
  private fb = inject(FormBuilder);

  constructor() {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      address: ['', Validators.required],
      role: ['FARMER', Validators.required],
      expertFundId: ['']
    });

    // Reset fund if role changes
    this.userForm.get('role')?.valueChanges.subscribe(role => {
      if (role !== 'EXPERT') {
        this.userForm.get('expertFundId')?.setValue('');
      }
    });
  }

  availableFunds = computed(() => {
    const allFunds = this.funds();
    const assignedFundIds = this.users()
      .filter(u => u.role === 'EXPERT' && u.expertFundId)
      .map(u => u.expertFundId);
    
    return allFunds.filter(f => !assignedFundIds.includes(f.id));
  });

  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.users();
    
    return this.users().filter(u => 
      (u.firstName?.toLowerCase() || '').includes(term) ||
      (u.lastName?.toLowerCase() || '').includes(term) ||
      (u.email?.toLowerCase() || '').includes(term)
    );
  });

  ngOnInit() {
    this.fetchUsers();
    this.fetchFunds();
  }

  fetchFunds() {
    this.fundService.getAllFunds().subscribe({
      next: (data) => this.funds.set(Array.isArray(data) ? data : []),
      error: (err) => console.error('Error fetching funds:', err)
    });
  }

  fetchUsers() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.userService.getAllUsers().subscribe({
      next: (data) => {
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

  submitUser() {
    if (this.userForm.invalid) {
      alert('Veuillez remplir correctement tous les champs.');
      return;
    }

    this.isSubmitting.set(true);
    this.userService.createUser(this.userForm.value).subscribe({
      next: () => {
        alert('Utilisateur créé avec succès !');
        this.showForm.set(false);
        this.userForm.reset();
        this.fetchUsers();
        this.isSubmitting.set(false);
      },
      error: (err) => {
        alert('Erreur lors de la création : ' + (err.error || err.message));
        this.isSubmitting.set(false);
      }
    });
  }

  deleteUser(userId: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          this.fetchUsers();
          alert('Utilisateur supprimé avec succès.');
        },
        error: (err) => {
          console.error('Error deleting user:', err);
          alert("Erreur lors de la suppression de l'utilisateur. Détails: " + (err.error || err.message));
        }
      });
    }
  }

  viewUserDetails(user: any) {
    this.selectedUser.set(user);
  }

  closeUserDetails() {
    this.selectedUser.set(null);
  }
}
