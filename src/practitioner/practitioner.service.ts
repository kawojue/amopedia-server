import { Injectable } from '@nestjs/common'
import { MiscService } from 'lib/misc.service'
import { PrismaService } from 'lib/prisma.service'
import { ResponseService } from 'lib/response.service'

@Injectable()
export class PractitionerService {
    constructor(
        private readonly misc: MiscService,
        private readonly prisma: PrismaService,
        private readonly response: ResponseService,
    ) { }
}
