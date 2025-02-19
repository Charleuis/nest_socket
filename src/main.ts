import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    stopAtFirstError: true,
    exceptionFactory: (errors) => {
      const messages = errors.map(error => 
        Object.values(error.constraints ?? {})[0]
      );
      const message = messages[0];
      return new BadRequestException(message);
    }
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
