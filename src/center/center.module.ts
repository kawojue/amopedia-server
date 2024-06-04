import { Module } from '@nestjs/common'
import { AwsService } from 'lib/aws.service'
import { MiscService } from 'lib/misc.service'
import { JwtModule } from 'src/jwt/jwt.module'
import { CenterService } from './center.service'
import { PassportModule } from '@nestjs/passport'
import { PrismaService } from 'lib/prisma.service'
import { CenterController } from './center.controller'
import { ResponseService } from 'lib/response.service'
import { EncryptionService } from 'lib/encryption.service'

@Module({
  imports: [JwtModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [CenterController],
  providers: [
    CenterService,
    AwsService,
    PrismaService,
    MiscService,
    ResponseService,
    EncryptionService,
  ],
})
export class CenterModule { }
