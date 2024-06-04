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
  //   return await this.adradospecService.signup(res, body)
  // }

  @Post('/login')
  async login(@Res() res: Response, @Body() body: LoginDTO) {
    return await this.adradospecService.login(res, body)
  }

  @ApiBearerAuth()
  @Post('/invite-member')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(Roles.admin)
  async inviteNewAdrasdospec(
    @Res() res: Response,
    @Req() req: IRequest,
    @Body() body: InviteDTO
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

  @Patch('/facilities/:centerId/toggle-status')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(Roles.admin)
  async toggleOrgStatus(
    @Res() res: Response,
    @Query() query: ToggleStatusDTO,
    @Param('centerId') centerId: string,
  ) {
    return await this.adradospecService.toggleOrgStatus(res, centerId, query)
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

  @Get('/analytics')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(Roles.specialist, Roles.admin)
  async analytics(@Res() res: Response) {
    return await this.adradospecService.analytics(res)
  }

  @Get('/charts')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(Roles.specialist, Roles.admin)
  async charts(@Res() res: Response, @Query() q: ChartDTO) {
    return await this.adradospecService.charts(res, q)
  }
}
