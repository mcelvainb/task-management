// apps/dashboard/src/app/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/auth';
  
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  register(email: string, password: string, firstName: string, lastName: string, orgName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, {
      email,
      password,
      firstName,
      lastName,
      organizationName: orgName,
    }).pipe(
      tap((response: any) => {
        this.login(response.access_token, response.user);
      })
    );
  }

  loginApi(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, {
      email,
      password,
    }).pipe(
      tap((response: any) => {
        this.login(response.access_token, response.user);
      })
    );
  }

  login(token: string, user: any): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.isLoggedInSubject.next(true);
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    this.isLoggedInSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('auth_token');
  }
}