// apps/dashboard/src/app/services/task.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  category: 'work' | 'personal' | 'other';
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/tasks';
  
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$ = this.tasksSubject.asObservable();

  loadTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl).pipe(
      tap((tasks) => this.tasksSubject.next(tasks))
    );
  }

  addTask(title: string, category: string): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, {
      title,
      category,
    }).pipe(
      tap((task) => {
        const tasks = this.tasksSubject.value;
        this.tasksSubject.next([...tasks, task]);
      })
    );
  }

  updateTaskStatus(id: string, status: Task['status']): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${id}`, { status }).pipe(
      tap((updatedTask) => {
        const tasks = this.tasksSubject.value.map(t =>
          t.id === id ? updatedTask : t
        );
        this.tasksSubject.next(tasks);
      })
    );
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const tasks = this.tasksSubject.value.filter(t => t.id !== id);
        this.tasksSubject.next(tasks);
      })
    );
  }
}