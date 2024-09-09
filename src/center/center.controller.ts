import {
  Req,
  Res,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  Patch,
  UseGuards,
  Controller,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger'
import {
  PatientStudyDTO,
  DesignateStudyDTO,
  EditPatientStudyDTO,
} from './dto/study.dto'
import {
  ChartDTO,
  FetchStaffDTO,
  FetchPatientDTO,
  FetchPatientStudyDTO,
} from './dto/fetch.dto'
import {
  InviteCenterAdminDTO,
  InviteMedicalStaffDTO
} from './dto/invite.dto'
import { Response } from 'express'
import { Roles } from '@prisma/client'
import { Role } from 'src/jwt/role.decorator'
import { SuspendStaffDTO } from './dto/auth.dto'
import { CenterService } from './center.service'
import { toUpperCase } from 'helpers/transformer'
import { AnyFilesInterceptor } from '@nestjs/platform-express'
import { JwtAuthRoleGuard } from 'src/jwt/jwt-auth-role.guard'
import { AddPatientDTO, EditPatientDTO } from './dto/patient.dto'
import { DicomTokenDTO } from 'src/auth/dto/dicom.dto'

@ApiTags('Center')
@Controller('center')
export class CenterController {
  constructor(private readonly centerService: CenterService) { }

  @ApiBearerAuth()
  @UseGuards(JwtAuthRoleGuard)
  @Get('/fetch/staffs')
  @Role(Roles.centerAdmin)
  async fetchMedicalStaff(
    @Req() req: IRequest,
    @Res() res: Response,
    @Query() query: FetchStaffDTO
  ) {
    await this.centerService.fetchStaffs(res, req.user, query)
  }

  @ApiBearerAuth()
  @Role(Roles.centerAdmin)
  @UseGuards(JwtAuthRoleGuard)
  @Patch('/manage/suspension/:staffId')
  async suspendMedicalStaff(
    @Req() req: IRequest,
    @Res() res: Response,
    @Query() query: SuspendStaffDTO,
    @Param('staffId') staffId: string,
  ) {
    await this.centerService.suspendStaff(res, staffId, req.user, query)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthRoleGuard)
  @Role(Roles.centerAdmin)
  @Post('/invite/medical-staff')
  async inviteMedicalStaff(
    @Req() req: IRequest,
    @Res() res: Response,
    @Body() body: InviteMedicalStaffDTO,
  ) {
    await this.centerService.inviteMedicalStaff(res, req.user, body)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthRoleGuard)
  @Role(Roles.centerAdmin)
  @Post('/invite/center-admin')
  async inviteCenterAdmin(
    @Req() req: IRequest,
    @Res() res: Response,
    @Body() body: InviteCenterAdminDTO,
  ) {
    await this.centerService.inviteCenterAdmin(res, req.user, body)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthRoleGuard)
  @Get('/analytics')
  @Role(Roles.centerAdmin)
  async analytics(@Req() req: IRequest, @Res() res: Response) {
    await this.centerService.analytics(res, req.user)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthRoleGuard)
  @Get('/analytics/report')
  @Role(Roles.centerAdmin, Roles.radiologist, Roles.doctor)
  async reportAnalytics(@Req() req: IRequest, @Res() res: Response) {
    await this.centerService.reportAnalytics(res, req.user)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthRoleGuard)
  @Get('/charts')
  @Role(Roles.centerAdmin)
  async charts(
    @Req() req: IRequest,
    @Res() res: Response,
    @Query() query: ChartDTO,
  ) {
    await this.centerService.charts(res, req.user, query)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthRoleGuard)
  @Post('/patient')
  @Role(Roles.centerAdmin)
  async addPatient(
    @Req() req: IRequest,
    @Res() res: Response,
    @Body() body: AddPatientDTO
  ) {
    await this.centerService.addPatient(res, req.user, body)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthRoleGuard)
  @Role(Roles.centerAdmin)
  @Put('/patient/:mrn/edit')
  async editPatient(
    @Req() req: IRequest,
    @Res() res: Response,
    @Param('mrn') mrn: string,
    @Body() body: EditPatientDTO,
  ) {
    await this.centerService.editPatient(res, mrn, req.user, body)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthRoleGuard)
  @Get('/patient/:mrn/fetch')
  async getPatient(
    @Req() req: IRequest,
    @Res() res: Response,
    @Param('mrn') mrn: string,
  ) {
    await this.centerService.getPatient(res, mrn, req.user)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthRoleGuard)
  @Role(Roles.centerAdmin)
  @Post('/patient/:mrn/study')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({
    summary: 'The formdata key should be paperworks'
  })
  async createPatientStudy(
    @Req() req: IRequest,
    @Res() res: Response,
    @Param('mrn') mrn: string,
    @Body() body: PatientStudyDTO,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    await this.centerService.createPatientStudy(res, mrn, body, req.user, files || [])
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthRoleGuard)
  @Get('/patient/:mrn/study')
  @Role(Roles.centerAdmin, Roles.doctor, Roles.radiologist)
  async fetchPatientStudies(
    @Req() req: IRequest,
    @Res() res: Response,
    @Param('mrn') mrn: string,
  ) {
    await this.centerService.fetchPatientStudies(mrn, res, req.user)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthRoleGuard)
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthRoleGuard)
  @UseInterceptors(AnyFilesInterceptor())
  @Put('/patient/:mrn/study/:studyId/edit')
  @ApiOperation({
    summary: 'The formdata key should be paperworks'
  })
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthRoleGuard)
  @Role(Roles.centerAdmin)
  @Patch('/patient/:mrn/study/:studyId/:practitionerId/designate')
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthRoleGuard)
  @Get('/patients')
  @Role(Roles.centerAdmin, Roles.doctor, Roles.radiologist)
  async fetchPatients(
    @Req() req: IRequest,
    @Res() res: Response,
    @Query() query: FetchPatientDTO,
  ) {
    await this.centerService.fetchPatients(res, req.user, query)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthRoleGuard)
  @Get('/reports')
  @Role(Roles.centerAdmin, Roles.doctor, Roles.radiologist)
  async fetchAllPatientStudies(
    @Req() req: IRequest,
    @Res() res: Response,
    @Query() query: FetchPatientStudyDTO
  ) {
    await this.centerService.fetchAllPatientStudies(res, req.user, query)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthRoleGuard)
  @Role(Roles.centerAdmin)
  @Post('/dicoms/:studyId')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({
    summary: 'The formdata key should be dicoms'
  })
  async uploadDicomFiles(
    @Req() req: IRequest,
    @Res() res: Response,
    @Param('studyId') studyId: string,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    await this.centerService.uploadDicomFiles(res, toUpperCase(studyId), req.user, files || [])
  }

  @Get('/dicoms')
  async fetchStudyDicoms(
    @Res() res: Response,
    @Query() q: DicomTokenDTO,
  ) {
    await this.centerService.fetchStudyDicoms(res, q)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthRoleGuard)
  @Get('/bin')
  @Role(Roles.centerAdmin)
  async bin(@Req() req: IRequest, @Res() res: Response) {
    await this.centerService.bin(res, req.user)
  }
}
