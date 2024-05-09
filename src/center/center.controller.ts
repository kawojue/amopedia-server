import { Response } from 'express'
import { Roles } from '@prisma/client'
import { Role } from 'src/role.decorator'
import { AuthGuard } from '@nestjs/passport'
import { AddPatientDTO } from './dto/patient'
import { SuspendStaffDto } from './dto/auth.dto'
import { CenterService } from './center.service'
import { PatientStudyDTO } from './dto/study.dto'
import { RolesGuard } from 'src/jwt/jwt-auth.guard'
import {
  Req, Res, UploadedFiles, UseGuards, UseInterceptors,
  Body, Controller, Get, Param, Patch, Post, Put, Query,
} from '@nestjs/common'
import { ChartDTO, FetchStaffDto } from './dto/fetch.dto'
import { AnyFilesInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
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

  @Role(Roles.centerAdmin)
  @Get('/analytics')
  async analytics(@Req() req: IRequest, @Res() res: Response) {
    return await this.centerService.analytics(res, req.user)
  }

  @Get('/charts')
  @Role(Roles.centerAdmin)
  async charts(
    @Req() req: IRequest,
    @Res() res: Response,
    @Query() query: ChartDTO,
  ) {
    return await this.centerService.charts(res, req.user, query)
  }

  @Post('/patient')
  async addPatient(
    @Req() req: IRequest,
    @Res() res: Response,
    @Body() body: AddPatientDTO
  ) {
    await this.centerService.addPatient(res, req.user, body)
  }

  @Put('/patient/:mrn/edit')
  @Role(Roles.centerAdmin, Roles.specialist)
  async editPatient(
    @Req() req: IRequest,
    @Res() res: Response,
    @Param('mrn') mrn: string,
    @Body() body: AddPatientDTO,
  ) {
    await this.centerService.editPatient(res, mrn, req.user, body)
  }

  @Get('/patient/:mrn/fetch')
  @Role(Roles.centerAdmin, Roles.specialist)
  async getPatient(
    @Req() req: IRequest,
    @Res() res: Response,
    @Param('mrn') mrn: string,
  ) {
    await this.centerService.getPatient(res, mrn, req.user)
  }

  @ApiOperation({
    summary: 'The formdata key should be paperworks'
  })
  @Post('/patient/:mrn/study')
  @Role(Roles.centerAdmin, Roles.specialist)
  @UseInterceptors(AnyFilesInterceptor())
  async createPatientStudy(
    @Req() req: IRequest,
    @Res() res: Response,
    @Param('mrn') mrn: string,
    @Body() body: PatientStudyDTO,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    await this.centerService.createPatientStudy(res, mrn, body, req.user, files)
  }

  @ApiOperation({
    summary: 'The formdata key should be paperworks'
  })
  @Put('/patient/:mrn/study/:studyId/edit')
  async editPatientStudy(
    @Req() req: IRequest,
    @Res() res: Response,
    @Body() body: PatientStudyDTO,
    @Param('studyId') studyId: string,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    await this.centerService.editPatientStudy(res, studyId, body, req.user, files)
  }
}
