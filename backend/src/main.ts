import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation: strips unknown fields, transforms types, returns
  // descriptive 400 errors for invalid request bodies/query params.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Allow the React dev server (port 3000) to call this API
  app.enableCors({ origin: 'http://localhost:3000' });

  await app.listen(process.env.PORT ?? 3001);
  console.log(`Backend running on http://localhost:${process.env.PORT ?? 3001}`);
}

bootstrap();
