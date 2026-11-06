import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('ServiceOpsBootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 4000;
  const corsOrigin = configService.get<string>('corsOrigin') || 'http://localhost:3000';

  // 1. Cookie Parser Middleware for Secure Refresh Tokens
  app.use(cookieParser(configService.get<string>('cookieSecret')));

  // 2. Strict CORS Configuration for Next.js App Router
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // 3. Global Input Validation and Sanitization Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips non-whitelisted payload properties
      forbidNonWhitelisted: true, // Throws 400 if malicious unexpected fields are injected
      transform: true, // Automatically transforms payloads to DTO instances
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 4. Swagger OpenAPI 3.0 Specification
  const config = new DocumentBuilder()
    .setTitle('ServiceOps ITSM Enterprise API')
    .setDescription(
      'ServiceOps RESTful API engine providing Identity, Ticketing, SLA Automation, Incident Swarming, and IT Asset CMDB services.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your 15-minute JWT access token',
        in: 'header',
      },
      'bearer',
    )
    .addTag('Authentication', 'Dual-token authentication, rotation, and profile recovery')
    .addTag('User Management', 'Enterprise user lifecycle, role bindings, and account security')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  logger.log(`🚀 ServiceOps Backend Engine is active on port: ${port}`);
  logger.log(`📚 OpenAPI Documentation available at: http://localhost:${port}/docs`);
}

bootstrap();

