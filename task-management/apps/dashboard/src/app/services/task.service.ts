import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Task {
  id: number;
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
  private tasksSubject = new BehaviorSubject<Task[]>([
    {
      id: 1,
      title: 'Design login page',
      status: 'done',
      category: 'work',
      createdAt: '2025-01-10',
    },
    {
      id: 2,
      title: 'Buy groceries',
      status: 'todo',
      category: 'personal',
      createdAt: '2025-01-11',
    },
    {
      id: 3,
      title: 'Review PR',
      status: 'in_progress',
      category: 'work',
      createdAt: '2025-01-11',
    },
  ]);

  tasks$ = this.tasksSubject.asObservable();

  addTask(title: string, category: string): void {
    const tasks = this.tasksSubject.value;
    const newTask: Task = {
      id: Math.max(...tasks.map(t => t.id), 0) + 1,
      title,
      status: 'todo',
      category: category as any,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.tasksSubject.next([...tasks, newTask]);
  }

  updateTaskStatus(id: number, status: Task['status']): void {
    const tasks = this.tasksSubject.value.map(t =>
      t.id === id ? { ...t, status } : t
    );
    this.tasksSubject.next(tasks);
  }

  deleteTask(id: number): void {
    const tasks = this.tasksSubject.value.filter(t => t.id !== id);
    this.tasksSubject.next(tasks);
  }
}
