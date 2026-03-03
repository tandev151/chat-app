import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(Logger);
  app.useLogger(logger);

  // CORS: browser sends exact origin (e.g. http://localhost:3001 or http://127.0.0.1:3001).
  // If the request origin is not in this list, the browser blocks the response (CORS error).
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://136.116.129.100',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Chat App API')
    .setDescription('API for Chat App')
    .setVersion('1.0')
    .addBasicAuth()
    .addBearerAuth()
    .build();

  app.setGlobalPrefix('api');

  const document = SwaggerModule.createDocument(app as any, config, {
    ignoreGlobalPrefix: false,
  });
  SwaggerModule.setup('api/docs', app as any, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(
    `Application listening on port ${port} (NODE_ENV=${process.env.NODE_ENV ?? 'development'})`,
  );

  logger.log(
    `Application is connected to the database ${process.env.DATABASE_URL?.toString()} ...`,
  );
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap', err);
  process.exit(1);
});
