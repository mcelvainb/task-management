import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Role, RoleType } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string, firstName: string, lastName: string, orgName: string) {
    // Check if user exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Create organization if it doesn't exist
    let organization = await this.organizationRepository.findOne({ where: { name: orgName } });
    if (!organization) {
      organization = this.organizationRepository.create({ name: orgName });
      await this.organizationRepository.save(organization);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      organization,
    });
    await this.userRepository.save(user);

    // Assign Owner role to first user in org, Admin role to others
    const ownerRole = await this.roleRepository.findOne({ where: { name: RoleType.OWNER } });
    const adminRole = await this.roleRepository.findOne({ where: { name: RoleType.ADMIN } });
    const userCount = await this.userRepository.count({ where: { organization: { id: organization.id } }, });
    const roleToAssign = userCount === 1 ? ownerRole : adminRole;
    if (roleToAssign) {
      const userRole = this.userRoleRepository.create({ 
        user, 
        role: roleToAssign 
      });
      await this.userRoleRepository.save(userRole);
      
      // Reload user to populate roles
      const updatedUser = await this.userRepository.findOne({ where: { id: user.id } });
      return this.generateToken(updatedUser);
    }
    
    return this.generateToken(user);
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user);
  }

  private generateToken(user: User) {
  const payload = {
    sub: user.id,
    email: user.email,
    orgId: user.organization.id,
    roles: user.roles?.map(ur => ur.role.name) || [],
  };

  return {
    access_token: this.jwtService.sign(payload),
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      organization: user.organization,
      roles: user.roles?.map(ur => ur.role.name) || [],
    },
  };
}

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

    async changeUserRole(currentUser: User, targetUserId: string, newRole: RoleType) {
    // Check if current user is owner or admin
    const isOwner = currentUser.roles.some(ur => ur.role.name === RoleType.OWNER);
    const isAdmin = currentUser.roles.some(ur => ur.role.name === RoleType.ADMIN);

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Only owners and admins can change user roles');
    }

    // Admins can only assign viewer role, owners can assign any role
    if (isAdmin && !isOwner && newRole !== RoleType.VIEWER) {
      throw new ForbiddenException('Admins can only assign viewer role');
    }

    // Get target user
    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new BadRequestException('User not found');
    }

    // Check if users are in the same organization
    if (targetUser.organization.id !== currentUser.organization.id) {
      throw new ForbiddenException('You can only change roles for users in your organization');
    }

    // Don't allow changing your own role
    if (targetUser.id === currentUser.id) {
      throw new ForbiddenException('You cannot change your own role');
    }

    // Get the new role
    const role = await this.roleRepository.findOne({ where: { name: newRole } });
    if (!role) {
      throw new BadRequestException('Invalid role');
    }

    // Remove existing roles
    await this.userRoleRepository.delete({ user: { id: targetUserId } });

    // Assign new role
    const userRole = this.userRoleRepository.create({
      user: targetUser,
      role,
    });
    await this.userRoleRepository.save(userRole);

    return { message: 'Role updated successfully', user: targetUser };
  }

  async getOrganizationUsers(currentUser: User) {
    const users = await this.userRepository.find({
      where: { organization: { id: currentUser.organization.id } },
      relations: ['roles', 'roles.role'],
    });

    return users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles?.map(ur => ur.role.name) || [],
    }));
  }

}