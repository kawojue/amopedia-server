import { Request, Response } from 'express'
import { AuthGuard } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { RolesGuard } from 'src/jwt/jwt-auth.guard'
import { EmailDto, LoginDto } from './dto/login.dto'
import { ChangePasswordDto } from './dto/password.dto'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { OrganizationSignupDto, PractitionerSignupDto } from './dto/signup.dto'
import { Body, Controller, Patch, Post, Req, Res, UseGuards } from '@nestjs/common'

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
}
