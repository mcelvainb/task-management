import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 API running on: http://localhost:${port}`);
}

bootstrap();