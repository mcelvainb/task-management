// apps/dashboard/src/app/tasks/task-dashboard.component.ts
import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task } from '../services/task.service';
import { AuthService } from '../services/auth.service';

type FilterType = 'all' | 'work' | 'personal' | 'completed';

@Component({
  selector: 'app-task-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-dashboard.component.html',
  styleUrls: ['./task-dashboard.component.css'],
})
export class TaskDashboardComponent {
  private taskService = inject(TaskService);
  private authService = inject(AuthService);

  tasks$ = this.taskService.tasks$;
  filter = signal<FilterType>('all');
  newTask = '';
  newCategory = 'work';
  filters: FilterType[] = ['all', 'work', 'personal', 'completed'];
  statuses: Task['status'][] = ['todo', 'in_progress', 'done'];

  filteredTasks = computed(() => {
    const tasks = (this.tasks$ as any)._value || [];
    const f = this.filter();

    return tasks.filter((t: Task) => {
      if (f === 'all') return true;
      if (f === 'work') return t.category === 'work';
      if (f === 'personal') return t.category === 'personal';
      if (f === 'completed') return t.status === 'done';
      return true;
    });
  });

  completedCount = computed(() => {
    const tasks = (this.tasks$ as any)._value || [];
    return tasks.filter((t: Task) => t.status === 'done').length;
  });

  inProgressCount = computed(() => {
    const tasks = (this.tasks$ as any)._value || [];
    return tasks.filter((t: Task) => t.status === 'in_progress').length;
  });

  addTask(): void {
    if (this.newTask.trim()) {
      this.taskService.addTask(this.newTask, this.newCategory);
      this.newTask = '';
    }
  }

  updateTaskStatus(id: number, status: Task['status']): void {
    this.taskService.updateTaskStatus(id, status);
  }

  deleteTask(id: number): void {
    this.taskService.deleteTask(id);
  }

  logout(): void {
    this.authService.logout();
  }
}
