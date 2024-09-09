import { Module } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { MiscService } from 'lib/misc.service'
import { AdspecService } from './adspec.service'
import { PassportModule } from '@nestjs/passport'
import { PrismaService } from 'lib/prisma.service'
import { AdspecController } from './adspec.controller'
import { ResponseService } from 'lib/response.service'
import { EncryptionService } from 'lib/encryption.service'

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AdspecController],
  providers: [
    JwtService,
    AdspecService,
    MiscService,
    PrismaService,
    ResponseService,
    EncryptionService,
  ],
  exports: [AdspecService]
})
export class AdspecModule { }
