import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { MiscService } from 'lib/misc.service'
import { AuthController } from './auth.controller'
import { JwtStrategy } from 'src/jwt/jwt.strategy'
import { PrismaService } from 'lib/prisma.service'
import { ResponseService } from 'lib/response.service'
import { EncryptionService } from 'lib/encryption.service'

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    MiscService,
    PrismaService,
    ResponseService,
    EncryptionService,
  ],
})
export class AuthModule { }
