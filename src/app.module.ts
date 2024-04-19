import { Module } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AppService } from './app.service'
import { AppController } from './app.controller'
import { PrismaService } from 'lib/prisma.service'

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, JwtService, PrismaService],
})
export class AppModule { }
