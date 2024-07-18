import { Response } from 'express'
import { Roles } from '@prisma/client'
import { Role } from 'src/jwt/role.decorator'
import { AdspecService } from './adspec.service'
import { LoginDTO } from 'src/auth/dto/login.dto'
import { ChartDTO } from 'src/center/dto/fetch.dto'
import { InviteDTO, SignupDTO } from './dto/auth.dto'
import { FetchPractitionersDTO } from './dto/prac.dto'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { JwtAuthRoleGuard } from 'src/jwt/jwt-auth-role.guard'
import { FetchCentersDTO, ToggleStatusDTO } from './dto/org.dto'
import {
  Body, Controller, Get, Param, Patch, Post, Query, Req, Res, UseGuards
} from '@nestjs/common'

@Controller('adspec')
@ApiTags("System Admin & Specialist")
export class AdspecController {
  constructor(private readonly adspecService: AdspecService) { }

  // @Post('/signup')
  // async signup(@Res() res: Response, @Body() body: SignupDTO) {
  //   await this.adspecService.signup(res, body)
  // }

  @Post('/login')
  async login(@Res() res: Response, @Body() body: LoginDTO) {
    await this.adspecService.login(res, body)
  }

  @ApiBearerAuth()
  @Role(Roles.admin)
  @Post('/invite-member')
  @UseGuards(JwtAuthRoleGuard)
  async inviteNewAdspec(
    @Res() res: Response,
    @Req() req: IRequest,
    @Body() body: InviteDTO
  ) {
    await this.adspecService.inviteNewAdspec(res, req.user, body)
  }

  @ApiBearerAuth()
  @Post('/fetch-members')
  @UseGuards(JwtAuthRoleGuard)
  @Role(Roles.admin, Roles.specialist)
  async fetchAdspec(@Res() res: Response,) {
    await this.adspecService.fetchAdspec(res)
  }

  @ApiBearerAuth()
  @Get('/centers')
  @UseGuards(JwtAuthRoleGuard)
  @Role(Roles.admin, Roles.specialist)
  async fetchCenters(
    @Res() res: Response,
    @Query() query: FetchCentersDTO
  ) {
    await this.adspecService.fetchCenters(res, query)
  }

  @ApiBearerAuth()
  @Get('/centers/:centerId')
  @Role(Roles.admin, Roles.specialist)
  @UseGuards(JwtAuthRoleGuard)
  async fetchOrganization(@Res() res: Response, @Param('centerId') centerId: string) {
    await this.adspecService.fetchCenter(res, centerId)
  }

  @ApiBearerAuth()
  @Role(Roles.admin)
  @UseGuards(JwtAuthRoleGuard)
  @Patch('/centers/:centerId/toggle-status')
  async toggleOrgStatus(
    @Res() res: Response,
    @Query() query: ToggleStatusDTO,
    @Param('centerId') centerId: string,
  ) {
    await this.adspecService.toggleOrgStatus(res, centerId, query)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthRoleGuard)
  @Role(Roles.admin, Roles.specialist)
  @Get('/practitioners')
  async fetchPractitioners(
    @Res() res: Response,
    @Query() query: FetchPractitionersDTO
  ) {
    await this.adspecService.fetchPractitioners(res, query)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthRoleGuard)
  @Role(Roles.admin, Roles.specialist)
  @Get('/practitioners/:practitionerId')
  async fetchPractitioner(
    @Res() res: Response,
    @Param('practitionerId') practitionerId: string,
  ) {
    await this.adspecService.fetchPractitioner(res, practitionerId)
  }

  @ApiBearerAuth()
  @Role(Roles.admin)
  @UseGuards(JwtAuthRoleGuard)
  @Patch('/practitioners/:practitionerId/toggle-status')
  async togglePractitionerStatus(
    @Res() res: Response,
    @Query() query: ToggleStatusDTO,
    @Param('practitionerId') practitionerId: string,
  ) {
    await this.adspecService.togglePractitionerStatus(res, practitionerId, query)
  }

  @ApiBearerAuth()
  @Get('/analytics')
  @UseGuards(JwtAuthRoleGuard)
  @Role(Roles.specialist, Roles.admin)
  async analytics(@Res() res: Response) {
    await this.adspecService.analytics(res)
  }

  @Get('/charts')
  @ApiBearerAuth()
  @UseGuards(JwtAuthRoleGuard)
  @Role(Roles.specialist, Roles.admin)
  async charts(@Res() res: Response, @Query() q: ChartDTO) {
    await this.adspecService.charts(res, q)
  }
}
