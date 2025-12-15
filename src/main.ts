import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import env from './core/serverEnv';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks(['SIGINT', 'SIGTERM']);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );
  await app.listen(env.PORT);
}
bootstrap();
