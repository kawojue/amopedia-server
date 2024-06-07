import { Response } from 'express'
import { Roles } from '@prisma/client'
import {
  ApiBearerAuth, ApiOperation, ApiTags
} from '@nestjs/swagger'
import { Role } from 'src/role.decorator'
import { AuthGuard } from '@nestjs/passport'
import { AddPatientDTO } from './dto/patient'
import {
  InviteCenterAdminDTO, InviteMedicalStaffDTO
} from './dto/invite.dto'
import { SuspendStaffDTO } from './dto/auth.dto'
import { CenterService } from './center.service'
import { RolesGuard } from 'src/jwt/jwt-auth.guard'
import {
  Req, Res, UploadedFiles, UseGuards, UseInterceptors,
  Body, Controller, Get, Param, Patch, Post, Put, Query,
} from '@nestjs/common'
import {
  DesignateStudyDTO, EditPatientStudyDTO, PatientStudyDTO
} from './dto/study.dto'
import { AnyFilesInterceptor } from '@nestjs/platform-express'
import {
  ChartDTO, FetchPatientDTO, FetchPatientStudyDTO, FetchStaffDTO
} from './dto/fetch.dto'
import { toUpperCase } from 'helpers/transformer'

@ApiBearerAuth()
@ApiTags('Center')
@Controller('center')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CenterController {
  constructor(private readonly centerService: CenterService) { }

  @Get('/fetch/staffs')
  @Role(Roles.centerAdmin)
  async fetchMedicalStaff(
    @Req() req: IRequest,
    @Res() res: Response,
    @Query() query: FetchStaffDTO
  ) {
    await this.centerService.fetchStaffs(res, req.user, query)
  }

  @Patch('/manage/suspension/:staffId')
  @Role(Roles.centerAdmin)
  async suspendMedicalStaff(
    @Req() req: IRequest,
    @Res() res: Response,
    @Query() query: SuspendStaffDTO,
    @Param('staffId') staffId: string,
  ) {
    await this.centerService.suspendStaff(res, staffId, req.user, query)
  }

  @Post('/invite/medical-staff')
  @Role(Roles.centerAdmin)
  async inviteMedicalStaff(
    @Req() req: IRequest,
    @Res() res: Response,
    @Body() body: InviteMedicalStaffDTO,
  ) {
    await this.centerService.inviteMedicalStaff(res, req.user, body)
  }

  @Post('/invite/center-admin')
  @Role(Roles.centerAdmin)
  async inviteCenterAdmin(
    @Req() req: IRequest,
    @Res() res: Response,
    @Body() body: InviteCenterAdminDTO,
  ) {
    await this.centerService.inviteCenterAdmin(res, req.user, body)
  }

  @Role(Roles.centerAdmin)
  @Get('/analytics')
  async analytics(@Req() req: IRequest, @Res() res: Response) {
    await this.centerService.analytics(res, req.user)
  }

  @Role(Roles.centerAdmin, Roles.radiologist, Roles.doctor)
  @Get('/analytics/report')
  async reportAnalytics(@Req() req: IRequest, @Res() res: Response) {
    await this.centerService.reportAnalytics(res, req.user)
  }

  @Get('/charts')
  @Role(Roles.centerAdmin)
  async charts(
    @Req() req: IRequest,
    @Res() res: Response,
    @Query() query: ChartDTO,
  ) {
    await this.centerService.charts(res, req.user, query)
  }

  @Post('/patient')
  @Role(Roles.centerAdmin)
  async addPatient(
    @Req() req: IRequest,
    @Res() res: Response,
    @Body() body: AddPatientDTO
  ) {
    await this.centerService.addPatient(res, req.user, body)
  }

  @Put('/patient/:mrn/edit')
  @Role(Roles.centerAdmin)
  async editPatient(
    @Req() req: IRequest,
    @Res() res: Response,
    @Param('mrn') mrn: string,
    @Body() body: AddPatientDTO,
  ) {
    await this.centerService.editPatient(res, mrn, req.user, body)
  }

  @Get('/patient/:mrn/fetch')
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
  @UseInterceptors(AnyFilesInterceptor())
  @Role(Roles.centerAdmin)
  async createPatientStudy(
    @Req() req: IRequest,
    @Res() res: Response,
    @Param('mrn') mrn: string,
    @Body() body: PatientStudyDTO,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    await this.centerService.createPatientStudy(res, mrn, body, req.user, files || [])
  }


  @Get('/patient/:mrn/study')
  @Role(Roles.centerAdmin, Roles.doctor, Roles.radiologist)
  async fetchPatientStudies(
    @Req() req: IRequest,
    @Res() res: Response,
    @Param('mrn') mrn: string,
  ) {
    await this.centerService.fetchPatientStudies(mrn, res, req.user)
  }

  @Get('/patient/:mrn/study/:studyId')
  @Role(Roles.centerAdmin, Roles.doctor, Roles.radiologist)
  async getPatientStudy(
    @Req() req: IRequest,
    @Res() res: Response,
    @Param('mrn') mrn: string,
    @Param('studyId') studyId: string
  ) {
    await this.centerService.getPatientStudy(res, req.user, mrn, toUpperCase(studyId))
  }

  @ApiOperation({
    summary: 'The formdata key should be paperworks'
  })
  @Put('/patient/:mrn/study/:studyId/edit')
  @UseInterceptors(AnyFilesInterceptor())
  @Role(Roles.centerAdmin)
  async editPatientStudy(
    @Req() req: IRequest,
    @Res() res: Response,
    @Body() body: EditPatientStudyDTO,
    @Param('studyId') studyId: string,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    await this.centerService.editPatientStudy(res, toUpperCase(studyId), body, req.user, files || [])
  }

  @Patch('/patient/:mrn/study/:studyId/:practitionerId/designate')
  @Role(Roles.centerAdmin)
  async designatePatientStudy(
    @Req() req: IRequest,
    @Res() res: Response,
    @Param('mrn') mrn: string,
    @Param('studyId') studyId: string,
    @Query() query: DesignateStudyDTO,
    @Param('practitionerId') practitionerId: string,
  ) {
    await this.centerService.designatePatientStudy(res, mrn, toUpperCase(studyId), practitionerId, req.user, query)
  }

  @Get('/patients')
  @Role(Roles.centerAdmin, Roles.doctor, Roles.radiologist)
  async fetchPatients(
    @Req() req: IRequest,
    @Res() res: Response,
    @Query() query: FetchPatientDTO,
  ) {
    await this.centerService.fetchPatients(res, req.user, query)
  }

  @Get('/reports')
  @Role(Roles.centerAdmin, Roles.doctor, Roles.radiologist)
  async fetchAllPatientStudies(
    @Req() req: IRequest,
    @Res() res: Response,
    @Query() query: FetchPatientStudyDTO
  ) {
    await this.centerService.fetchAllPatientStudies(res, req.user, query)
  }

  @ApiOperation({
    summary: 'The formdata key should be dicoms'
  })
  @Post('/dicoms/:studyId')
  @UseInterceptors(AnyFilesInterceptor())
  @Role(Roles.centerAdmin)
  async uploadDicomFiles(
    @Req() req: IRequest,
    @Res() res: Response,
    @Param('studyId') studyId: string,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    await this.centerService.uploadDicomFiles(res, toUpperCase(studyId), req.user, files || [])
  }

  @Role(Roles.centerAdmin)
  async bin(@Req() req: IRequest, @Res() res: Response) {
    await this.centerService.bin(res, req.user)
  }
}
