import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Role, RoleType } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepo: any;
  let mockOrgRepo: any;
  let mockRoleRepo: any;
  let mockUserRoleRepo: any;
  let mockJwtService: any;

  const mockOrg = {
    id: 'org-1',
    name: 'Test Org',
  };

  const mockRole = {
    id: 'role-1',
    name: RoleType.OWNER,
    description: 'Owner',
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    password: 'hashed-password',
    firstName: 'John',
    lastName: 'Doe',
    organization: mockOrg,
    roles: [{ role: mockRole }],
  };

  beforeEach(async () => {
    mockUserRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockReturnValue(mockUser),
      save: jest.fn().mockResolvedValue(mockUser),
      count: jest.fn().mockResolvedValue(1),
    };

    mockOrgRepo = {
      findOne: jest.fn().mockResolvedValue(mockOrg),
      create: jest.fn().mockReturnValue(mockOrg),
      save: jest.fn().mockResolvedValue(mockOrg),
    };

    mockRoleRepo = {
      findOne: jest.fn().mockResolvedValue(mockRole),
    };

    mockUserRoleRepo = {
      create: jest.fn().mockReturnValue({ role: mockRole }),
      save: jest.fn().mockResolvedValue({ role: mockRole }),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('test-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrgRepo,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepo,
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: mockUserRoleRepo,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user and assign owner role', async () => {
      // First findOne: check if user exists (returns null)
      // Second findOne: reload user after role assignment
      mockUserRepo.findOne
        .mockResolvedValueOnce(null)  // Check existing user
        .mockResolvedValueOnce(mockUser); // Reload user with roles
      mockUserRepo.count.mockResolvedValueOnce(1);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed-password');

      const result = await service.register('john@test.com', 'password', 'John', 'Doe', 'Test Org');

      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'john@test.com',
          firstName: 'John',
          lastName: 'Doe',
        })
      );
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(mockUserRoleRepo.save).toHaveBeenCalled();
      expect(result.access_token).toBe('test-token');
    });

    it('should throw BadRequestException if user already exists', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(mockUser);

      await expect(
        service.register('test@test.com', 'password', 'John', 'Doe', 'Test Org')
      ).rejects.toThrow(BadRequestException);
    });

    it('should create organization if it does not exist', async () => {
      mockUserRepo.findOne
        .mockResolvedValueOnce(null)  // Check existing user
        .mockResolvedValueOnce(mockUser); // Reload user with roles
      mockOrgRepo.findOne.mockResolvedValueOnce(null);
      mockUserRepo.count.mockResolvedValueOnce(1);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed-password');

      await service.register('john@test.com', 'password', 'John', 'Doe', 'New Org');

      expect(mockOrgRepo.create).toHaveBeenCalledWith({ name: 'New Org' });
      expect(mockOrgRepo.save).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user and return token', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.login('test@test.com', 'password');

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashed-password');
      expect(result.access_token).toBe('test-token');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.login('nonexistent@test.com', 'password')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.login('test@test.com', 'wrong-password')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user if found', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(mockUser);

      const result = await service.validateUser('user-1');

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(null);

      const result = await service.validateUser('nonexistent');

      expect(result).toBeNull();
    });
  });
});