import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TaskService, CreateTaskDto, UpdateTaskDto } from './task.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Post()
  async create(@Request() req: any, @Body() dto: CreateTaskDto) {
    return this.taskService.createTask(req.user.user, dto);
  }

  @Get()
  async getTasks(@Request() req: any) {
    return this.taskService.getTasks(req.user.user);
  }

  @Get(':id')
  async getTask(@Request() req: any, @Param('id') taskId: string) {
    return this.taskService.getTaskById(req.user.user, taskId);
  }

  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskService.updateTask(req.user.user, taskId, dto);
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') taskId: string) {
    await this.taskService.deleteTask(req.user.user, taskId);
    return { message: 'Task deleted successfully' };
  }
}