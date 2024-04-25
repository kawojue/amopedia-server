import { Module } from '@nestjs/common'
import { MiscService } from 'lib/misc.service'
import { CenterService } from './center.service'
import { PrismaService } from 'lib/prisma.service'
import { CenterController } from './center.controller'
import { ResponseService } from 'lib/response.service'
import { EncryptionService } from 'lib/encryption.service'

@Module({
  controllers: [CenterController],
  providers: [
    CenterService,
    PrismaService,
    MiscService,
    ResponseService,
    EncryptionService,
  ],
})
export class CenterModule { }
