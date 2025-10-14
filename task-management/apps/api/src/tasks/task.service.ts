import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus, TaskCategory } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { AuditLog, AuditAction } from '../entities/audit-log.entity';

export class CreateTaskDto {
  title: string;
  description?: string;
  category?: TaskCategory;
}

export class UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
}

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async createTask(user: User, dto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create({
      title: dto.title,
      description: dto.description,
      category: dto.category || TaskCategory.OTHER,
      creator: user,
      organization: user.organization,
    });

    const savedTask = await this.taskRepository.save(task);

    // Log the action
    await this.logAudit(user, AuditAction.CREATE, 'Task', savedTask.id, `Created task: ${dto.title}`);

    return savedTask;
  }

  async getTasks(user: User): Promise<Task[]> {
    const tasks = await this.taskRepository.find({
      where: { organization: { id: user.organization.id } },
      relations: ['creator'],
    });

    // Log read access
    await this.logAudit(user, AuditAction.READ, 'Task', null, `Retrieved ${tasks.length} tasks`);

    return tasks;
  }

  async getTaskById(user: User, taskId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, organization: { id: user.organization.id } },
      relations: ['creator'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.logAudit(user, AuditAction.READ, 'Task', taskId, `Retrieved task: ${task.title}`);

    return task;
  }

  async updateTask(user: User, taskId: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, organization: { id: user.organization.id } },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check permissions: only creator or admin can update
    const isCreator = task.creator.id === user.id;
    const isAdmin = user.roles.some(ur => ur.role.name === 'admin' || ur.role.name === 'owner');

    if (!isCreator && !isAdmin) {
      throw new ForbiddenException('You can only update your own tasks');
    }

    // Update task
    Object.assign(task, dto);
    const updatedTask = await this.taskRepository.save(task);

    await this.logAudit(user, AuditAction.UPDATE, 'Task', taskId, `Updated task: ${task.title}`);

    return updatedTask;
  }

  async deleteTask(user: User, taskId: string): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, organization: { id: user.organization.id } },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check permissions: only creator, admin, or owner can delete
    const isCreator = task.creator.id === user.id;
    const isAdminOrOwner = user.roles.some(ur => ur.role.name === 'admin' || ur.role.name === 'owner');

    if (!isCreator && !isAdminOrOwner) {
      throw new ForbiddenException('You can only delete your own tasks');
    }

    await this.taskRepository.remove(task);

    await this.logAudit(user, AuditAction.DELETE, 'Task', taskId, `Deleted task: ${task.title}`);
  }

  private async logAudit(
    user: User,
    action: AuditAction,
    resource: string,
    resourceId: string | null,
    description: string,
  ): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      user,
      action,
      resource,
      resourceId,
      description,
    });

    await this.auditLogRepository.save(auditLog);
  }
}