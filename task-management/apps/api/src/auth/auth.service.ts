import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
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
    console.log('ownerRole: ' + ownerRole?.name);
    const adminRole = await this.roleRepository.findOne({ where: { name: RoleType.ADMIN } });
    console.log('adminRole: ' + adminRole?.name);
    const userCount = await this.userRepository.count({ where: { organization: { id: organization.id } }, });
    console.log('userCount in org: ' + userCount);
    const roleToAssign = userCount === 1 ? ownerRole : adminRole;
    console.log('roleToAssign: ' + roleToAssign?.name);
    if (roleToAssign) {
      const userRole = this.userRoleRepository.create({ 
        user, 
        role: roleToAssign 
      });
      await this.userRoleRepository.save(userRole);
    }
    console.log('userRole assigned' + roleToAssign?.name);
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
      roles: user.roles.map(ur => ur.role.name),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organization: user.organization,
        roles: user.roles.map(ur => ur.role.name),
      },
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }
}