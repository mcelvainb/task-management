// apps/dashboard/src/app/auth/auth.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent {
  formMode = signal<'login' | 'register'>('login');
  email = '';
  password = '';
  firstName = '';
  lastName = '';
  orgName = '';

  constructor(private authService: AuthService) {}

  toggleFormMode(): void {
    this.formMode.set(this.formMode() === 'login' ? 'register' : 'login');
  }

  handleLogin(): void {
    if (this.formMode() === 'login' && this.email && this.password) {
      this.authService.login('mock-token', {
        email: this.email,
        firstName: 'John',
      });
    } else if (
      this.formMode() === 'register' &&
      this.email &&
      this.password &&
      this.firstName &&
      this.lastName &&
      this.orgName
    ) {
      this.authService.login('mock-token', {
        email: this.email,
        firstName: this.firstName,
        lastName: this.lastName,
        organization: this.orgName,
      });
    }
  }
}
