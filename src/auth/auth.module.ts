import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AwsService } from 'lib/aws.service'
import { MiscService } from 'lib/misc.service'
import { JwtModule } from 'src/jwt/jwt.module'
import { PlunkService } from 'lib/plunk.service'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from './auth.controller'
import { PrismaService } from 'lib/prisma.service'
import { ResponseService } from 'lib/response.service'
import { EncryptionService } from 'lib/encryption.service'

@Module({
  imports: [JwtModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthController],
  providers: [
    AuthService,
    AwsService,
    MiscService,
    PlunkService,
    PrismaService,
    ResponseService,
    EncryptionService,
  ],
})
export class AuthModule { }
