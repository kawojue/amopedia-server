import { Response } from 'express'
import { Roles } from '@prisma/client'
import { Role } from 'src/role.decorator'
import { AuthGuard } from '@nestjs/passport'
import { FetchStaffDto } from './dto/fetch.dto'
import { SuspendStaffDto } from './dto/auth.dto'
import { CenterService } from './center.service'
import { RolesGuard } from 'src/jwt/jwt-auth.guard'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import {
  Body,
  Controller, Get, Param, Patch, Post, Query, Req, Res, UseGuards
} from '@nestjs/common'
import { InviteCenterAdminDTO, InviteMedicalStaffDTO } from './dto/invite.dto'

@ApiTags('Center')
@Controller('center')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CenterController {
  constructor(private readonly centerService: CenterService) { }

  @Get('/fetch/staffs')
  @Role(Roles.centerAdmin)
  async fetchMedicalStaff(
    @Req() req: IRequest,
    @Res() res: Response,
    @Query() query: FetchStaffDto
  ) {
    return await this.centerService.fetchStaffs(res, req.user, query)
  }

  @Patch('/manage/suspension/:staffId')
  @Role(Roles.centerAdmin)
  async suspendMedicalStaff(
    @Req() req: IRequest,
    @Res() res: Response,
    @Query() query: SuspendStaffDto,
    @Param('staffId') staffId: string,
  ) {
    return await this.centerService.suspendStaff(res, staffId, req.user, query)
  }

  @Post('/invite/medical-staff')
  @Role(Roles.centerAdmin)
  async inviteMedicalStaff(
    @Req() req: IRequest,
    @Res() res: Response,
    @Body() body: InviteMedicalStaffDTO,
  ) {
    return await this.centerService.inviteMedicalStaff(res, req.user, body)
  }

  @Post('/invite/center-admin')
  @Role(Roles.centerAdmin)
  async inviteCenterAdmin(
    @Req() req: IRequest,
    @Res() res: Response,
    @Body() body: InviteCenterAdminDTO,
  ) {
    return await this.centerService.inviteCenterAdmin(res, req.user, body)
  }
}
