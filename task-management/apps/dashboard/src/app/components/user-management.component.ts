// apps/dashboard/src/app/components/user-management.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

interface OrgUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css'],
})
export class UserManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:3000/auth';
  
  users: OrgUser[] = [];
  selectedRoles: { [userId: string]: string } = {};
  currentUser = this.authService.getUser();
  
  get isOwner(): boolean {
    return this.currentUser?.roles?.includes('owner') || false;
  }
  
  get isAdmin(): boolean {
    return this.currentUser?.roles?.includes('admin') || false;
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.http.get<OrgUser[]>(`${this.apiUrl}/users`).subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (err) => console.error('Failed to load users:', err),
    });
  }

  canManageUser(user: OrgUser): boolean {
    // Can't manage yourself
    if (user.id === this.currentUser?.id) return false;
    
    // Owner can manage anyone
    if (this.isOwner) return true;
    
    // Admin can only manage viewers
    if (this.isAdmin && user.roles.includes('viewer')) return true;
    
    return false;
  }

  changeRole(userId: string): void {
    const roleName = this.selectedRoles[userId];
    if (!roleName) return;

    this.http.put(`${this.apiUrl}/users/${userId}/role`, {
      userId,
      roleName,
    }).subscribe({
      next: () => {
        alert('Role updated successfully!');
        this.selectedRoles[userId] = '';
        this.loadUsers();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update role');
      },
    });
  }
}