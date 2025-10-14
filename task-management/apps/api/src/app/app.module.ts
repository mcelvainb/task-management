import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User, Organization, Role, UserRole, Task, AuditLog } from '../entities/index.entity';
import { TaskModule } from '../tasks/task.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'sqlite',
        database: config.get<string>('DB_PATH') || 'data/app.db',
        entities: [User, Organization, Role, UserRole, Task, AuditLog],
        synchronize: true,
        logging: false,
      }),
    }),

    TypeOrmModule.forFeature([User, Organization, Role, UserRole, Task, AuditLog]),
    AuthModule,
    TaskModule,
  ],
})
export class AppModule {}