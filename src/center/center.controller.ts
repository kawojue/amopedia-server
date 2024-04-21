import { Response } from 'express'
import { Roles } from '@prisma/client'
import { ApiTags } from '@nestjs/swagger'
import { Role } from 'src/role.decorator'
import { AuthGuard } from '@nestjs/passport'
import { CenterService } from './center.service'
import { RolesGuard } from 'src/jwt/jwt-auth.guard'
import { FetchMedicalStaffDto } from './dto/fetch.dto'
import { SuspendMedicalStaffDto } from './dto/auth.dto'
import { Controller, Get, Param, Patch, Query, Req, Res, UseGuards } from '@nestjs/common'

@ApiTags('Center')
@Controller('center')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CenterController {
  constructor(private readonly centerService: CenterService) { }

  @Get('/fetch/medical-staff')
  @Role(Roles.centerAdmin)
  async fetchMedicalStaff(
    @Req() req: IRequest,
    @Res() res: Response,
    @Query() query: FetchMedicalStaffDto
  ) {
    return await this.centerService.fetchMedicalStaffs(res, req.user, query)
  }

  @Role(Roles.centerAdmin)
  @Patch('/manage-suspension/:staffId')
  async suspendMedicalStaff(
    @Req() req: IRequest,
    @Res() res: Response,
    @Param('staffId') staffId: string,
    @Query() query: SuspendMedicalStaffDto,
  ) {
    return await this.centerService.suspendMedicalStaff(res, staffId, req.user, query)
  }
}
