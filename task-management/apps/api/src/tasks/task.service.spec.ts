import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TaskService } from './task.service';
import { Task, TaskStatus, TaskCategory } from '../entities/task.entity';
import { AuditLog, AuditAction } from '../entities/audit-log.entity';
import { Organization } from '../entities/organization.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('TaskService', () => {
  let service: TaskService;
  let mockTaskRepo: any;
  let mockAuditRepo: any;
  let mockOrgRepo: any;

  const mockUser = {
    id: 'user-1',
    email: 'john@test.com',
    firstName: 'John',
    lastName: 'Doe',
    organization: { id: 'org-1', name: 'Test Org' },
    roles: [{ role: { name: 'owner' } }],
  };

  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'A test task',
    status: TaskStatus.TODO,
    category: TaskCategory.WORK,
    creator: mockUser,
    organization: mockUser.organization,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockTaskRepo = {
      create: jest.fn().mockReturnValue(mockTask),
      save: jest.fn().mockResolvedValue(mockTask),
      find: jest.fn().mockResolvedValue([mockTask]),
      findOne: jest.fn().mockResolvedValue(mockTask),
      remove: jest.fn().mockResolvedValue(mockTask),
    };

    mockAuditRepo = {
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({}),
    };

    mockOrgRepo = {
      findOne: jest.fn().mockResolvedValue(mockUser.organization),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepo,
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditRepo,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrgRepo,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
  });

  describe('createTask', () => {
    it('should create a task and log audit', async () => {
      const dto = {
        title: 'New Task',
        description: 'New description',
        category: TaskCategory.WORK,
      };

      const result = await service.createTask(mockUser as any, dto);

      expect(mockTaskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: dto.title,
          creator: mockUser,
        })
      );
      expect(mockTaskRepo.save).toHaveBeenCalled();
      expect(mockAuditRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockTask);
    });
  });

  describe('getTasks', () => {
    it('should return all tasks for organization', async () => {
      const result = await service.getTasks(mockUser as any);

      expect(mockTaskRepo.find).toHaveBeenCalledWith({
        where: { organization: { id: 'org-1' } },
        relations: ['creator'],
      });
      expect(result).toEqual([mockTask]);
      expect(mockAuditRepo.save).toHaveBeenCalled();
    });
  });

  describe('getTaskById', () => {
    it('should return a single task', async () => {
      const result = await service.getTaskById(mockUser as any, 'task-1');

      expect(mockTaskRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'task-1', organization: { id: 'org-1' } },
        relations: ['creator'],
      });
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      mockTaskRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.getTaskById(mockUser as any, 'nonexistent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTask', () => {
    it('creator should be able to update task', async () => {
      const dto = { status: TaskStatus.IN_PROGRESS };

      const result = await service.updateTask(mockUser as any, 'task-1', dto);

      expect(mockTaskRepo.save).toHaveBeenCalled();
      expect(mockAuditRepo.save).toHaveBeenCalled();
    });

    it('non-creator should not be able to update task', async () => {
      const otherUser = { ...mockUser, id: 'user-2', roles: [{ role: { name: 'viewer' } }] };
      const dto = { status: TaskStatus.IN_PROGRESS };

      await expect(
        service.updateTask(otherUser as any, 'task-1', dto)
      ).rejects.toThrow(ForbiddenException);
    });

    it('admin should be able to update any task', async () => {
      const adminUser = { ...mockUser, id: 'admin-1', roles: [{ role: { name: 'admin' } }] };
      const dto = { status: TaskStatus.IN_PROGRESS };

      const result = await service.updateTask(adminUser as any, 'task-1', dto);

      expect(mockTaskRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if task not found', async () => {
      mockTaskRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.updateTask(mockUser as any, 'nonexistent', {})
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTask', () => {
    it('creator should be able to delete task', async () => {
      await service.deleteTask(mockUser as any, 'task-1');

      expect(mockTaskRepo.remove).toHaveBeenCalled();
      expect(mockAuditRepo.save).toHaveBeenCalled();
    });

    it('non-creator non-admin should not be able to delete task', async () => {
      const otherUser = { ...mockUser, id: 'user-2', roles: [{ role: { name: 'viewer' } }] };

      await expect(
        service.deleteTask(otherUser as any, 'task-1')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if task not found', async () => {
      mockTaskRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.deleteTask(mockUser as any, 'nonexistent')
      ).rejects.toThrow(NotFoundException);
    });
  });
});