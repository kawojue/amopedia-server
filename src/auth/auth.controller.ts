import { LoginDto } from './dto/login.dto'
import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { Body, Controller, Post, Req, Res } from '@nestjs/common'
import { OrganizationSignupDto, PractitionerSignupDto } from './dto/signup.dto'
import { ApiTags } from '@nestjs/swagger'

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
}
