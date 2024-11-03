import { Module } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AwsService } from 'lib/aws.service'
import { MiscService } from 'lib/misc.service'
import { CenterService } from './center.service'
import { PassportModule } from '@nestjs/passport'
import { PrismaService } from 'lib/prisma.service'
import { CenterController } from './center.controller'
import { ResponseService } from 'lib/response.service'
import { EncryptionService } from 'lib/encryption.service'

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [CenterController],
  providers: [
    CenterService,
    JwtService,
    AwsService,
    MiscService,
    PrismaService,
    ResponseService,
    EncryptionService,
  ],
  exports: [CenterService]
})
export class CenterModule { }
