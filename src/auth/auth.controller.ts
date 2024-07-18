import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { DownloadFileDTO } from './dto/file'
import {
  Body, UploadedFile, Post, Put, Req, Patch, Query,
  Controller, UseGuards, Res, UseInterceptors, Get,
} from '@nestjs/common'
import { EmailDTO, LoginDTO } from './dto/login.dto'
import { ChangePasswordDTO } from './dto/password.dto'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthRoleGuard } from 'src/jwt/jwt-auth-role.guard'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { OrganizationSignupDTO, PractitionerSignupDTO } from './dto/signup.dto'

@ApiTags("Auth")
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('/register/organization')
  async organizationSignup(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: OrganizationSignupDTO
  ) {
    await this.authService.organizationSignup(req, res, body)
  }

  @Post('/register/practitioner')
  async practitionerSignup(@Res() res: Response, @Body() body: PractitionerSignupDTO) {
    await this.authService.practitionerSignup(res, body)
  }

  @Post('/login')
  async login(@Res() res: Response, @Body() body: LoginDTO) {
    await this.authService.login(res, body)
  }

  @Patch('/reset-password')
  async resetPassword(@Res() res: Response, @Body() body: EmailDTO) {
    await this.authService.resetPassword(res, body)
  }

  @ApiBearerAuth()
  @Patch('/change-password')
  @UseGuards(JwtAuthRoleGuard)
  async changePassword(
    @Req() req: IRequest,
    @Res() res: Response,
    @Body() body: ChangePasswordDTO
  ) {
    await this.authService.changePassword(res, req.user, body)
  }

  @ApiBearerAuth()
  @Put('upload/profile-photo')
  @UseGuards(JwtAuthRoleGuard)
  @UseInterceptors(FileInterceptor('profile_photo'))
  @ApiOperation({ summary: 'The formdata key should be profile_photo' })
  async updateAvatar(
    @Req() req: IRequest,
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File
  ) {
    await this.authService.updateAvatar(res, file, req.user)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthRoleGuard)
  @Get('/download')
  async downloadFile(@Res() res: Response, @Query() q: DownloadFileDTO) {
    await this.authService.downloadFile(res, q.path)
  }
}
