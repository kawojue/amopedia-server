import { Module } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AuthService } from './auth.service'
import { AwsService } from 'lib/aws.service'
import { MiscService } from 'lib/misc.service'
import { PlunkService } from 'lib/plunk.service'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from './auth.controller'
import { PrismaService } from 'lib/prisma.service'
import { JwtStrategy } from 'src/jwt/jwt.strategy'
import { ResponseService } from 'lib/response.service'
import { EncryptionService } from 'lib/encryption.service'

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthController],
  providers: [
    JwtService,
    AuthService,
    JwtStrategy,
    AwsService,
    MiscService,
    PlunkService,
    PrismaService,
    ResponseService,
    EncryptionService,
  ],
  exports: [AuthService]
})
export class AuthModule { }
