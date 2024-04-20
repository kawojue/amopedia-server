import { Module } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AppService } from './app.service'
import { JwtModule } from './jwt/jwt.module'
import { MiscService } from 'lib/misc.service'
import { AuthModule } from './auth/auth.module'
import { AppController } from './app.controller'
import { PassportModule } from '@nestjs/passport'
import { PrismaService } from 'lib/prisma.service'
import { CenterModule } from './center/center.module'
import { ResponseService } from 'lib/response.service'
import { EncryptionService } from 'lib/encryption.service'

@Module({
  imports: [
    AuthModule,
    JwtModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    CenterModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtService,
    MiscService,
    PrismaService,
    ResponseService,
    EncryptionService,
  ],
})
export class AppModule { }
