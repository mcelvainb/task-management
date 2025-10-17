import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.css'],
})
export class UserInfoComponent {
  private authService = inject(AuthService);
  user = this.authService.getUser();

  getInitials(): string {
    if (!this.user?.firstName || !this.user?.lastName) return '?';
    return `${this.user.firstName[0]}${this.user.lastName[0]}`.toUpperCase();
  }
}