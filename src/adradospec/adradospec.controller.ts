import { Response } from 'express'
import { Roles } from '@prisma/client'
import { Role } from 'src/role.decorator'
import { AuthGuard } from '@nestjs/passport'
import { LoginDTO } from 'src/auth/dto/login.dto'
import { RolesGuard } from 'src/jwt/jwt-auth.guard'
import { ChartDTO } from 'src/center/dto/fetch.dto'
import { InviteDTO, SignupDTO } from './dto/auth.dto'
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
  // async signup(@Res() res: Response, @Body() body: SignupDTO) {
  //   await this.adradospecService.signup(res, body)
  // }

  @Post('/login')
  async login(@Res() res: Response, @Body() body: LoginDTO) {
    await this.adradospecService.login(res, body)
  }

  @ApiBearerAuth()
  @Role(Roles.admin)
  @Post('/invite-member')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async inviteNewAdrasdospec(
    @Res() res: Response,
    @Req() req: IRequest,
    @Body() body: InviteDTO
  ) {
    await this.adradospecService.inviteNewAdrasdospec(res, req.user, body)
  }

  @ApiBearerAuth()
  @Post('/fetch-members')
  @Role(Roles.admin, Roles.specialist)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async fetchAdradospec(@Res() res: Response,) {
    await this.adradospecService.fetchAdradospec(res)
  }

  @ApiBearerAuth()
  @Get('/facilities')
  @Role(Roles.admin, Roles.specialist)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async fetchOrganizations(
    @Res() res: Response,
    @Query() query: FetchOrganizationsDTO
  ) {
    await this.adradospecService.fetchOrganizations(res, query)
  }

  @ApiBearerAuth()
  @Get('/facilities/:centerId')
  @Role(Roles.admin, Roles.specialist)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async fetchOrganization(@Res() res: Response, @Param('centerId') centerId: string) {
    await this.adradospecService.fetchOrganization(res, centerId)
  }

  @ApiBearerAuth()
  @Role(Roles.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch('/facilities/:centerId/toggle-status')
  async toggleOrgStatus(
    @Res() res: Response,
    @Query() query: ToggleStatusDTO,
    @Param('centerId') centerId: string,
  ) {
    await this.adradospecService.toggleOrgStatus(res, centerId, query)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(Roles.admin, Roles.specialist)
  @Get('/practitioners')
  async fetchPractitioners(
    @Res() res: Response,
    @Query() query: FetchPractitionersDTO
  ) {
    await this.adradospecService.fetchPractitioners(res, query)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(Roles.admin, Roles.specialist)
  @Get('/practitioners/:practitionerId')
  async fetchPractitioner(
    @Res() res: Response,
    @Param('practitionerId') practitionerId: string,
  ) {
    await this.adradospecService.fetchPractitioner(res, practitionerId)
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
    await this.adradospecService.togglePractitionerStatus(res, practitionerId, query)
  }

  @Get('/analytics')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(Roles.specialist, Roles.admin)
  async analytics(@Res() res: Response) {
    await this.adradospecService.analytics(res)
  }

  @Get('/charts')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(Roles.specialist, Roles.admin)
  async charts(@Res() res: Response, @Query() q: ChartDTO) {
    await this.adradospecService.charts(res, q)
  }
}
