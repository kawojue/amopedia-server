import { Request, Response } from 'express'
import { AuthGuard } from '@nestjs/passport'
import { AuthService } from './auth.service'
import {
  Body, UploadedFile, Post, Put, Req, Patch,
  Controller, UseGuards, Res, UseInterceptors,
  Get,
  Query,
} from '@nestjs/common'
import { RolesGuard } from 'src/jwt/jwt-auth.guard'
import { EmailDto, LoginDto } from './dto/login.dto'
import { ChangePasswordDto } from './dto/password.dto'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { OrganizationSignupDto, PractitionerSignupDto } from './dto/signup.dto'
import { DownloadFileDTO } from './dto/file'

@ApiTags("Auth")
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('/register/organization')
  async organizationSignup(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: OrganizationSignupDto
  ) {
    return await this.authService.organizationSignup(req, res, body)
  }

  @Post('/register/practitioner')
  async practitionerSignup(
    @Res() res: Response,
    @Body() body: PractitionerSignupDto
  ) {
    return await this.authService.practitionerSignup(res, body)
  }

  @Post('/login')
  async login(
    @Res() res: Response,
    @Body() body: LoginDto
  ) {
    return await this.authService.login(res, body)
  }

  @Patch('/reset-password')
  async resetPassword(
    @Res() res: Response,
    @Body() body: EmailDto
  ) {
    return await this.authService.resetPassword(res, body)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch('/change-password')
  async changePassword(
    @Req() req: IRequest,
    @Res() res: Response,
    @Body() body: ChangePasswordDto
  ) {
    return await this.authService.changePassword(res, req.user, body)
  }

  @ApiOperation({ summary: 'The formdata key should be profile_photo' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Put('upload/profile-photo')
  @UseInterceptors(FileInterceptor('profile_photo'))
  async updateAvatar(
    @Req() req: IRequest,
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File
  ) {
    return await this.authService.updateAvatar(res, file, req.user)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('/download')
  async downloadFile(@Res() res: Response, @Query() q: DownloadFileDTO) {
    return await this.authService.downloadFile(res, q.path)
  }
}
