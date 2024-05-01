import { Module } from '@nestjs/common'
import { MiscService } from 'lib/misc.service'
import { PrismaService } from 'lib/prisma.service'
import { ResponseService } from 'lib/response.service'
import { PractitionerService } from './practitioner.service'
import { PractitionerController } from './practitioner.controller'

@Module({
  controllers: [PractitionerController],
  providers: [
    PractitionerService,
    ResponseService,
    PrismaService,
    MiscService,
  ],
})
export class PractitionerModule { }
