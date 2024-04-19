import { Module } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { AppController } from './app.controller'
import { PrismaService } from 'lib/prisma.service'

@Module({
  imports: [
    AuthModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtService,
    PrismaService
  ],
})
export class AppModule { }
