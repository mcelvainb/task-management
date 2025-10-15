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
  error = '';
  loading = false;

  constructor(private authService: AuthService) {}

  toggleFormMode(): void {
    this.formMode.set(this.formMode() === 'login' ? 'register' : 'login');
    this.error = '';
  }

  handleLogin(): void {
    this.error = '';
    this.loading = true;

    if (this.formMode() === 'login' && this.email && this.password) {
      this.authService.loginApi(this.email, this.password).subscribe({
        next: () => {
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Login failed';
          this.loading = false;
        },
      });
    } else if (
      this.formMode() === 'register' &&
      this.email &&
      this.password &&
      this.firstName &&
      this.lastName &&
      this.orgName
    ) {
      this.authService.register(
        this.email,
        this.password,
        this.firstName,
        this.lastName,
        this.orgName
      ).subscribe({
        next: () => {
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Registration failed';
          this.loading = false;
        },
      });
    }
  }
}