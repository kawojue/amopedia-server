import { Module } from '@nestjs/common'
import { MiscService } from 'lib/misc.service'
import { PrismaService } from 'lib/prisma.service'
import { ResponseService } from 'lib/response.service'
import { AdradospecService } from './adradospec.service'
import { EncryptionService } from 'lib/encryption.service'
import { AdradospecController } from './adradospec.controller'

@Module({
  controllers: [AdradospecController],
  providers: [
    AdradospecService,
    MiscService,
    PrismaService,
    ResponseService,
    EncryptionService,
  ],
})
export class AdradospecModule { }
