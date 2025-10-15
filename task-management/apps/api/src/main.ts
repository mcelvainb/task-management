// apps/api/src/main.ts
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { DataSource } from 'typeorm';
import { seedRoles } from './database/seeders/seed-roles';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: 'http://localhost:4200', // Your Angular dev server
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe());
  
  // Seed roles on startup
  const dataSource = app.get(DataSource);
  await seedRoles(dataSource);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 API running on: http://localhost:${port}`);
}

bootstrap();