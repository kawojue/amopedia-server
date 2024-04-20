import { Response } from 'express'
import { AuthService } from './auth.service'
import { Body, Controller, Post, Res } from '@nestjs/common'
import { OrganizationSignupDto, PractitionerSignupDto } from './dto/signup.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('/register/organization')
  async organizationSignup(
    @Res() res: Response,
    @Body() body: OrganizationSignupDto
  ) {
    return await this.authService.organizationSignup(res, body)
  }


  @Post('/register/practitioner')
  async practitionerSignup(
    @Res() res: Response,
    @Body() body: PractitionerSignupDto
  ) {
    return await this.authService.practitionerSignup(res, body)
  }
}
