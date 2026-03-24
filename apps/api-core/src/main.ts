import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET não definido. Configure a variável de ambiente antes de iniciar.');
  }
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('ACIAV Saúde API')
    .setDescription('API do sistema de gestão de saúde corporativa ACIAV Saúde')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
