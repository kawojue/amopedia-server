import { Module } from '@nestjs/common'
import { MiscService } from 'lib/misc.service'
import { JwtModule } from 'src/jwt/jwt.module'
import { PassportModule } from '@nestjs/passport'
import { PrismaService } from 'lib/prisma.service'
import { ResponseService } from 'lib/response.service'
import { AdradospecService } from './adradospec.service'
import { EncryptionService } from 'lib/encryption.service'
import { AdradospecController } from './adradospec.controller'

@Module({
  imports: [JwtModule, PassportModule.register({ defaultStrategy: 'jwt' })],
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
