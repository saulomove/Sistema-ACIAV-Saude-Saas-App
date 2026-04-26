import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET não definido. Configure a variável de ambiente antes de iniciar.');
  }
  const app = await NestFactory.create(AppModule);

  // Aumentar limite de body para importação de planilhas grandes
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Servir uploads como arquivos estáticos
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? [
      'https://aciavsaude.com.br',
      'https://www.aciavsaude.com.br',
      'https://app.aciavsaude.com.br',
      'https://admin.aciavsaude.com.br',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'capacitor://localhost',
      'ionic://localhost',
      'https://localhost',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('ACIAV Saúde API')
      .setDescription('API do sistema de gestão de saúde corporativa ACIAV Saúde')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
