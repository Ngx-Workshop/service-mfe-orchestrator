import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });
  // If you use globalPipes or interceptors in main.ts, mirror them here if they affect DTO shape.

  const config = new DocumentBuilder()
    .setTitle('NGX MFE Orchestrator API')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const out = join(process.cwd(), 'openapi.json');
  writeFileSync(out, JSON.stringify(document, null, 2));
  await app.close();
  console.log('✅ OpenAPI written to', out);
}

generate();
