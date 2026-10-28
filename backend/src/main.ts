import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { setupApp } from './app.setup.js';
import { EnvVars } from './config/env.validation.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  setupApp(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('File system explorer')
    .setDescription('Create, search and delete folders and files.')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  const config = app.get(ConfigService<EnvVars, true>);
  await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
