import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { TaskDashboardComponent } from './tasks/task-dashboard.component';
import { AuthService } from './services/auth.service';

@Component({
  imports: [CommonModule, RouterModule, AuthComponent, TaskDashboardComponent],
  selector: 'app-root',
  template: `
    @if (isLoggedIn$ | async) {
      <app-task-dashboard></app-task-dashboard>
    } @else {
      <app-auth></app-auth>
    }
  `,
  styles: [],
})
export class App {
  private authService = inject(AuthService);
  isLoggedIn$ = this.authService.isLoggedIn$;
}
