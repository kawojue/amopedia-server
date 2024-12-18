import * as morgan from 'morgan'
import * as express from 'express'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app/app.module'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap() {
  const PORT: number = parseInt(process.env.PORT, 10) || 2004
  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: [
      `http://localhost:5173`,
      `http://localhost:3000`,
      `http://localhost:${PORT}`,
      `https://amorad.vercel.app`,
      `https://amorad-dicom.vercel.app`,
      'https://amopedia.org',
    ],
    optionsSuccessStatus: 200,
    methods: 'GET,PATCH,POST,PUT,DELETE',
  })
  app.use(express.json({ limit: 100 << 20 }))
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'))
  app.useGlobalPipes(new ValidationPipe({ transform: true }))

  const swaggerOptions = new DocumentBuilder()
    .setTitle('Amorad Documentation')
    .setDescription('API Endpoints')
    .setVersion('1.2')
    .addServer(`https://amorad.onrender.com`, 'Staging')
    .addServer(`http://localhost:${PORT}`, 'Local')
    .addBearerAuth()
    .build()

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerOptions)
  SwaggerModule.setup('docs', app, swaggerDocument)

  await app.listen(PORT)
  console.log(`http://localhost:${PORT}`)
}
bootstrap().catch(err => console.error(err.message))