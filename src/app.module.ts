import { Module } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AppService } from './app.service'
import { AppController } from './app.controller'
import { PassportModule } from '@nestjs/passport'

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, JwtService],
})
export class AppModule { }
