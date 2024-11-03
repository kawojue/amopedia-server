import { Module } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AppService } from './app.service'
import { MiscService } from 'lib/misc.service'
import { AppController } from './app.controller'
import { AuthModule } from 'src/auth/auth.module'
import { PrismaService } from 'lib/prisma.service'
import { ResponseService } from 'lib/response.service'
import { CenterModule } from 'src/center/center.module'
import { AdspecModule } from 'src/adspec/adspec.module'
import { EncryptionService } from 'lib/encryption.service'

@Module({
  imports: [
    AuthModule,
    CenterModule,
    AdspecModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtService,
    MiscService,
    PrismaService,
    ResponseService,
    EncryptionService,
  ],
  exports: [AppService]
})
export class AppModule { }
