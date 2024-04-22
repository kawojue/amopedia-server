import { Response } from 'express'
import { Roles } from '@prisma/client'
import { Role } from 'src/role.decorator'
import { AuthGuard } from '@nestjs/passport'
import { LoginDto } from 'src/auth/dto/login.dto'
import { RolesGuard } from 'src/jwt/jwt-auth.guard'
import { InviteDto, SignupDto } from './dto/auth.dto'
import { FetchPractitionersDTO } from './dto/prac.dto'
import { AdradospecService } from './adradospec.service'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { FetchOrganizationsDTO, ToggleStatusDTO } from './dto/org.dto'
import {
  Body, Controller, Get, Param, Patch, Post, Query, Req, Res, UseGuards
} from '@nestjs/common'

@ApiTags("Adradospec")
@Controller('adradospec')
export class AdradospecController {
  constructor(private readonly adradospecService: AdradospecService) { }

  // @Post('/signup')
  // async signup(@Res() res: Response, @Body() body: SignupDto) {
  //   return await this.adradospecService.signup(res, body)
  // }

  @Post('/login')
  async login(@Res() res: Response, @Body() body: LoginDto) {
    return await this.adradospecService.login(res, body)
  }

  @ApiBearerAuth()
  @Post('/invite-member')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(Roles.admin)
  async inviteNewAdrasdospec(
    @Res() res: Response,
    @Req() req: IRequest,
    @Body() body: InviteDto
  ) {
    return await this.adradospecService.inviteNewAdrasdospec(res, req.user, body)
  }

  @ApiBearerAuth()
  @Post('/fetch-members')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(Roles.admin, Roles.specialist)
  async fetchAdradospec(@Res() res: Response,) {
    return await this.adradospecService.fetchAdradospec(res)
  }

  @ApiBearerAuth()
  @Get('/facilities')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(Roles.admin, Roles.specialist)
  async fetchOrganizations(
    @Res() res: Response,
    @Query() query: FetchOrganizationsDTO
  ) {
    return await this.adradospecService.fetchOrganizations(res, query)
  }

  @Patch('/facilities/:orgId/toggle-status')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(Roles.admin)
  async toggleOrgStatus(
    @Res() res: Response,
    @Param('orgId') orgId: string,
    @Query() query: ToggleStatusDTO,
  ) {
    return await this.adradospecService.toggleOrgStatus(res, orgId, query)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(Roles.admin, Roles.specialist)
  @Get('/practitioners')
  async fetchPractitioners(
    @Res() res: Response,
    @Query() query: FetchPractitionersDTO
  ) {
    return await this.adradospecService.fetchPractitioners(res, query)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(Roles.admin, Roles.specialist)
  @Get('/practitioners/:practitionerId')
  async fetchPractitioner(
    @Res() res: Response,
    @Param('practitionerId') practitionerId: string,
  ) {
    return await this.adradospecService.fetchPractitioner(res, practitionerId)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(Roles.admin)
  @Patch('/practitioners/:practitionerId/toggle-status')
  async togglePractitionerStatus(
    @Res() res: Response,
    @Query() query: ToggleStatusDTO,
    @Param('practitionerId') practitionerId: string,
  ) {
    return await this.adradospecService.togglePractitionerStatus(res, practitionerId, query)
  }
}
