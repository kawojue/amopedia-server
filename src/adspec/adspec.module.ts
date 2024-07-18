import { Module } from '@nestjs/common'
import { MiscService } from 'lib/misc.service'
import { JwtModule } from 'src/jwt/jwt.module'
import { AdspecService } from './adspec.service'
import { PassportModule } from '@nestjs/passport'
import { PrismaService } from 'lib/prisma.service'
import { AdspecController } from './adspec.controller'
import { ResponseService } from 'lib/response.service'
import { EncryptionService } from 'lib/encryption.service'

@Module({
  imports: [JwtModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AdspecController],
  providers: [
    AdspecService,
    MiscService,
    PrismaService,
    ResponseService,
    EncryptionService,
  ],
})
export class AdspecModule { }
