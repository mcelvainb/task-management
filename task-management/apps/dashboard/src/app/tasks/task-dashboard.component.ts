import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task } from '../services/task.service';
import { AuthService } from '../services/auth.service';
import { UserInfoComponent } from '../components/user-info.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserManagementComponent } from '../components/user-management.component';

type FilterType = 'all' | 'work' | 'personal' | 'completed';

@Component({
  selector: 'app-task-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, UserInfoComponent, UserManagementComponent],
  templateUrl: './task-dashboard.component.html',
  styleUrls: ['./task-dashboard.component.css'],
})

export class TaskDashboardComponent implements OnInit {
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  
  currentUser = this.authService.getUser();

  ngOnInit(): void {
    this.taskService.loadTasks().subscribe();
  }

  tasks$ = this.taskService.tasks$;
  filter = signal<FilterType>('all');
  newTask = '';
  newCategory = 'work';
  filters: FilterType[] = ['all', 'work', 'personal', 'completed'];
  statuses: Task['status'][] = ['todo', 'in_progress', 'done'];
  tasksSignal = toSignal(this.taskService.tasks$, { initialValue: [] });

  filteredTasks = computed(() => {
    const tasks = this.tasksSignal();
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
    const tasks = this.tasksSignal();
    return tasks.filter((t: Task) => t.status === 'done').length;
  });

  inProgressCount = computed(() => {
    const tasks = this.tasksSignal();
    return tasks.filter((t: Task) => t.status === 'in_progress').length;
  });

  get canManageUsers(): boolean {
    const user = this.currentUser;
    return user?.roles?.includes('owner');
  }

  canDeleteTask(task: Task): boolean {
    const user = this.currentUser;
    if (!user || !task.creator) return false;
    
    const isCreator = task.creator.id === user.id;
    const isOwner = user.roles?.includes('owner');
    
    return isCreator || isOwner;
  }
  

  addTask(): void {
    if (this.newTask.trim()) {
      this.taskService.addTask(this.newTask, this.newCategory).subscribe({
        next: () => {
          this.newTask = '';
        },
        error: (err) => console.error('Failed to add task:', err),
      });
    }
  }

  updateTaskStatus(id: string, status: Task['status']): void {
    this.taskService.updateTaskStatus(id, status).subscribe();
  }

  deleteTask(id: string): void {
    this.taskService.deleteTask(id).subscribe();
  }

  logout(): void {
    this.authService.logout();
  }
}
