// apps/api/src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Get, Request, Put, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RoleType } from '../entities/role.entity';

export class RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

export class LoginDto {
  email: string;
  password: string;
}

export class ChangeRoleDto {
  userId: string;
  roleName: RoleType;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(
      body.email,
      body.password,
      body.firstName,
      body.lastName,
      body.organizationName,
    );
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentUser(@Request() req: { user: any }) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Put('users/:userId/role')
  async changeUserRole(
    @Request() req: { user: any },
    @Param('userId') userId: string,
    @Body() body: ChangeRoleDto,
  ) {
    return this.authService.changeUserRole(req.user.user, userId, body.roleName);
  }

  @UseGuards(JwtAuthGuard)
  @Get('users')
  async getOrganizationUsers(@Request() req: { user: any }) {
    return this.authService.getOrganizationUsers(req.user.user);
  }
}