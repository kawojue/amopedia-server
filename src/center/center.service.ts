import { Response } from 'express'
import { Roles } from '@prisma/client'
import { Injectable } from '@nestjs/common'
import { AddPatientDTO } from './dto/patient'
import { genFilename, genPassword } from 'helpers/generator'
import { MiscService } from 'lib/misc.service'
import { StatusCodes } from 'enums/statusCodes'
import { SuspendStaffDto } from './dto/auth.dto'
import { PrismaService } from 'lib/prisma.service'
import { ResponseService } from 'lib/response.service'
import { ChartDTO, FetchStaffDto } from './dto/fetch.dto'
import { EncryptionService } from 'lib/encryption.service'
import { InviteCenterAdminDTO, InviteMedicalStaffDTO } from './dto/invite.dto'
import { titleText, toLowerCase, toUpperCase, transformMRN } from 'helpers/transformer'
import { validateFile } from 'utils/file'
import { AwsService } from 'lib/aws.service'
import { PatientStudyDTO } from './dto/study.dto'

@Injectable()
export class CenterService {
    constructor(
        private readonly aws: AwsService,
        private readonly misc: MiscService,
        private readonly prisma: PrismaService,
        private readonly response: ResponseService,
        private readonly encryption: EncryptionService,
    ) { }

    async fetchStaffs(
        res: Response,
        { sub }: ExpressUser,
        {
            limit = 50, page = 1,
            role, search = '', sortBy
        }: FetchStaffDto
    ) {
        try {
            limit = Number(limit)
            page = Number(page)
            if (isNaN(limit) || isNaN(page) || limit <= 0 || page <= 0) {
                return this.response.sendError(res, StatusCodes.BadRequest, 'Invalid pagination parameters')
            }

            const offset = (page - 1) * limit

            const admin = await this.prisma.centerAdmin.findUnique({
                where: { id: sub },
                include: { center: true }
            })

            if (!admin || !admin.center) {
                return this.response.sendError(res, StatusCodes.NotFound, 'Center Admin or Center not found')
            }

            const center = admin.center

            const data = await (this.prisma[role === "centerAdmin" ? 'centerAdmin' : 'centerPractitioner'] as any).findMany({
                where: {
                    role,
                    centerId: center.id,
                    OR: [
                        { email: { contains: search, mode: 'insensitive' } },
                        { phone: { contains: search, mode: 'insensitive' } },
                        { fullname: { contains: search, mode: 'insensitive' } },
                    ]
                },
                take: limit,
                skip: offset,
                select: {
                    id: true,
                    role: true,
                    email: true,
                    phone: true,
                    status: true,
                    fullname: true,
                    createdAt: true,
                },
                orderBy: sortBy === "name" ? { fullname: 'asc' } : { createdAt: 'desc' }
            })

            this.response.sendSuccess(res, StatusCodes.OK, { data })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async suspendStaff(
        res: Response,
        staffId: string,
        { sub, centerId }: ExpressUser,
        { action }: SuspendStaffDto,
    ) {
        try {
            const admin = await this.prisma.centerAdmin.findUnique({
                where: { id: sub }
            })

            const centerAdmin = await this.prisma.centerAdmin.findUnique({
                where: { id: staffId }
            })

            const practitioner = await this.prisma.practitioner.findUnique({
                where: { id: staffId, centerId }
            })

            let modelName = "practitioner"

            if (!centerAdmin && !practitioner) {
                return this.response.sendError(res, StatusCodes.NotFound, "Staff not found")
            }

            if (centerAdmin) {
                if (sub === centerAdmin.id) {
                    return this.response.sendError(res, StatusCodes.BadRequest, "You can't suspend yourself")
                }

                if (!admin.superAdmin) {
                    return this.response.sendError(res, StatusCodes.Unauthorized, 'Only super admin has access to suspend center admin')
                }

                modelName = "centerAdmin"
            }

            await this.prisma[modelName].update({
                where: { id: staffId, centerId },
                data: { status: action }
            })

            const staffType = centerAdmin ? "Center Admin" : "Center Practitioner"
            const staffStatus = action === "ACTIVE" ? "activated" : "suspended"

            this.response.sendSuccess(res, StatusCodes.OK, {
                message: `${staffType} has been ${staffStatus}`
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async inviteMedicalStaff(
        res: Response,
        { centerId }: ExpressUser,
        {
            practiceNumber, profession,
            zip_code, state, address, city,
            country, email, fullname, phone,
        }: InviteMedicalStaffDTO
    ) {
        try {
            email = toLowerCase(email)
            fullname = titleText(fullname)
            practiceNumber = toUpperCase(practiceNumber)

            const isExists = await this.prisma.practitioner.findFirst({
                where: {
                    OR: [
                        { email: { equals: email, mode: 'insensitive' } },
                        { practiceNumber: { equals: practiceNumber, mode: 'insensitive' } },
                    ]
                }
            })

            if (isExists) {
                return this.response.sendError(res, StatusCodes.Conflict, "Email or practice number already exist")
            }

            const pswd = await genPassword()
            const password = await this.encryption.hashAsync(pswd)

            const practitioner = await this.prisma.practitioner.create({
                data: {
                    center: { connect: { id: centerId } },
                    city, country, email, fullname, phone,
                    type: 'center', zip_code, state, address,
                    practiceNumber, status: 'ACTIVE', password,
                    role: profession as Roles,
                }
            })

            if (practitioner) {
                // TODO: mail practitioner the generated pswd
            }

            this.response.sendSuccess(res, StatusCodes.OK, {
                message: `A new ${profession} has been invited`
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async inviteCenterAdmin(
        res: Response,
        { sub }: ExpressUser,
        { email, fullname, phone }: InviteCenterAdminDTO
    ) {
        try {
            email = toLowerCase(email)
            fullname = titleText(fullname)

            const admin = await this.prisma.centerAdmin.findUnique({
                where: { id: sub, superAdmin: true },
                select: { center: true }
            })

            if (!admin) {
                return this.response.sendError(res, StatusCodes.NotFound, 'Only super admin can invite a new admin')
            }

            const isExists = await this.prisma.centerAdmin.findUnique({
                where: { email }
            })

            if (isExists) {
                return this.response.sendError(res, StatusCodes.Conflict, 'Existing admin')
            }

            const pswd = await genPassword()
            const password = await this.encryption.hashAsync(pswd, 12)

            const centerAdmin = await this.prisma.centerAdmin.create({
                data: {
                    email, fullname, phone, password,
                    center: { connect: { id: admin.center.id } }
                }
            })

            if (centerAdmin) {
                // TODO: mail center admin their pswd
            }

            this.response.sendSuccess(res, StatusCodes.OK, {
                message: "A new center admin has been invited"
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async analytics(res: Response, { centerId }: ExpressUser) {
        try {
            const [
                patientCounts, patients,
                pracCounts, adminCounts
            ] = await this.prisma.$transaction([
                this.prisma.patient.count({ where: { centerId } }),
                this.prisma.patient.findMany({
                    where: { centerId },
                    select: {
                        caseStudies: {
                            select: { dicoms: true }
                        }
                    }
                }),
                this.prisma.practitioner.count({
                    where: { centerId, type: 'center' }
                }),
                this.prisma.centerAdmin.count({ where: { centerId } })
            ])

            let totalDicomCounts = 0
            await Promise.all(patients.map(async patient => {
                const caseStudies = patient.caseStudies
                await Promise.all(caseStudies.map(async caseStudy => {
                    const dicomCounts = await Promise.all(caseStudy.dicoms.map(async dicom => {
                        if (dicom?.path) {
                            return 1
                        } else {
                            return 0
                        }
                    }))
                    totalDicomCounts += dicomCounts.reduce((total, count) => total + count, 0)
                }))
            }))

            const totalStaffs = pracCounts + adminCounts

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: { patientCounts, totalDicomCounts, totalStaffs }
            })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error calculating analytics")
        }
    }

    async charts(
        res: Response,
        { centerId }: ExpressUser,
        { q }: ChartDTO,
    ) {
        try {
            let total = 0

            const currentYear = new Date().getFullYear()
            let labels = [
                'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
            ]

            const chart: {
                label: string
                count: string
            }[] = []

            if (q === "weekdays") {
                labels = ['MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT', 'SUN']

                for (let i = 0; i < 7; i++) {
                    const count = await this.prisma.patient.count({
                        where: {
                            centerId,
                            AND: [
                                { createdAt: { gte: new Date(currentYear, 0, i + 1) } },
                                { createdAt: { lt: new Date(currentYear + 1, 0, i + 1) } }
                            ]
                        }
                    })
                    chart.push({ label: labels[i], count: count.toString() })
                    total += count
                }
            } else if (q === "monthly") {
                for (let i = 0; i < labels.length; i++) {
                    const startDate = new Date(currentYear, i, 1)
                    let endMonth = i + 1
                    let endYear = currentYear

                    if (endMonth === 12) {
                        endMonth = 1
                        endYear = currentYear + 1
                    } else {
                        endMonth++
                    }

                    const endDate = new Date(endYear, endMonth - 1, 1)

                    const count = await this.prisma.patient.count({
                        where: {
                            centerId,
                            AND: [
                                { createdAt: { gte: startDate } },
                                { createdAt: { lt: endDate } }
                            ]
                        }
                    })

                    chart.push({ label: labels[i], count: count.toString() })
                    total += count
                }
            }

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: { chart, total }
            })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error caching chart")
        }
    }

    async addPatient(
        res: Response,
        { centerId }: ExpressUser,
        {
            address, gender, nin,
            marital_status, fullname,
            zip_code, dob, phone, email,
        }: AddPatientDTO,
    ) {
        try {
            email = toLowerCase(email)
            fullname = titleText(email)

            const patient = await this.prisma.patient.findUnique({
                where: {
                    centerId,
                    OR: [
                        { email: { equals: email, mode: 'insensitive' } },
                        { phone: { equals: phone, mode: 'insensitive' } },
                    ]
                }
            })

            if (patient) {
                return this.response.sendError(res, StatusCodes.Conflict, `Patient with MRN: ${patient.mrn} already exist`)
            }

            const lastPatient = await this.prisma.patient.findFirst({
                orderBy: { createdAt: 'desc' },
                select: { mrn: true }
            })

            const mrn = transformMRN(lastPatient ? Number(lastPatient.mrn) + 1 : 1)

            const newPatient = await this.prisma.patient.create({
                data: {
                    address, gender, nin, mrn,
                    maritalStatus: marital_status,
                    fullname, zip_code, dob, phone, email,
                    center: { connect: { id: centerId } },
                }
            })

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: newPatient,
                message: "New patient has been added to the record"
            })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error saving a new patient")
        }
    }

    async editPatient(
        res: Response,
        mrn: string,
        { centerId }: ExpressUser,
        {
            address, gender, nin,
            marital_status, fullname,
            zip_code, dob, phone, email,
        }: AddPatientDTO,
    ) {
        try {
            email = toLowerCase(email)
            fullname = titleText(email)

            const patient = await this.prisma.patient.findUnique({
                where: { mrn, centerId }
            })

            if (!patient) {
                return this.response.sendError(res, StatusCodes.NotFound, `Patient does not exist`)
            }

            if (patient.status === "Archived") {
                return this.response.sendError(res, StatusCodes.Unauthorized, "Unarchive before editing the patient")
            }

            const updatedPatient = await this.prisma.patient.update({
                where: { mrn, centerId },
                data: {
                    zip_code, dob, phone, email,
                    maritalStatus: marital_status,
                    address, gender, nin, fullname,
                }
            })

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: updatedPatient,
                message: "Message is has been updated"
            })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error updating patient record")
        }
    }

    async getPatient(
        res: Response,
        mrn: string,
        { centerId }: ExpressUser,
    ) {
        try {
            const patient = await this.prisma.patient.findUnique({
                where: { mrn, centerId }
            })

            if (!patient) {
                return this.response.sendError(res, StatusCodes.NotFound, `Patient does not exist`)
            }

            this.response.sendSuccess(res, StatusCodes.OK, { data: patient })
        } catch (err) {
            this.misc.handleServerError(res, err, "Something went wrong while getting a patient record")
        }
    }

    async createPatientStudy(
        res: Response,
        mrn: string,
        body: PatientStudyDTO,
        { centerId }: ExpressUser,
        files: Array<Express.Multer.File>,
    ) {
        try {
            const patient = await this.prisma.patient.findUnique({
                where: { mrn, centerId }
            })

            if (!patient) {
                return this.response.sendError(res, StatusCodes.NotFound, "Patient does not exist")
            }

            let paperwork = [] as IFile[]
            if (files?.length) {
                try {
                    const results = await Promise.all(files.map(async file => {
                        const re = validateFile(file, 5 << 20, '.pdf', '.docx', '.png', '.jpg', '.jpeg')

                        if (re?.status) {
                            return this.response.sendError(res, re.status, re.message)
                        }

                        const path = `${centerId}/${mrn}/${genFilename(re.file.originalname)}`
                        await this.aws.uploadS3(file, path)

                        return {
                            path,
                            type: re.file.mimetype,
                            url: this.aws.getS3(path)
                        }
                    }))

                    paperwork = results.filter((result): result is IFile => !!result)
                } catch (err) {
                    try {
                        await this.aws.removeFiles(paperwork)
                    } catch (err) {
                        return this.response.sendError(res, StatusCodes.InternalServerError, "Error uploading paperwork(s)")
                    }
                }
            }

            const studyId = await genPassword()

            await this.prisma.patientStudy.create({
                data: {
                    ...body, paperwork,
                    status: 'Unassigned',
                    study_id: studyId.toUpperCase(),
                    patient: { connect: { id: patient.id } }
                }
            })

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: { studyId },
                message: "Patient Study has been added"
            })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error creating patient study")
        }
    }

    async editPatientStudy(
        res: Response,
        studyId: string,
        body: PatientStudyDTO,
        { centerId }: ExpressUser,
        files: Array<Express.Multer.File>,
    ) {
        try {
            const study = await this.prisma.patientStudy.findUnique({
                where: { study_id: studyId },
                include: { patient: true }
            })

            if (!study) {
                return this.response.sendError(res, StatusCodes.NotFound, "Patient study not found")
            }

            if (study.patient.status === "Archived") {
                return this.response.sendError(res, StatusCodes.Forbidden, "Patient has been archived. Unarchived first..")
            }

            const mrn = study.patient.mrn

            if (study.patient.centerId !== centerId) {
                return this.response.sendError(res, StatusCodes.Unauthorized, "Seek permission to edit")
            }

            let paperwork = [] as IFile[]
            if (files?.length) {
                try {
                    const results = await Promise.all(files.map(async file => {
                        const re = validateFile(file, 5 << 20, '.pdf', '.docx', '.png', '.jpg', '.jpeg')

                        if (re?.status) {
                            return this.response.sendError(res, re.status, re.message)
                        }

                        const path = `${centerId}/${mrn}/${genFilename(re.file.originalname)}`
                        await this.aws.uploadS3(file, path)

                        return {
                            path,
                            type: re.file.mimetype,
                            url: this.aws.getS3(path)
                        }
                    }))

                    paperwork = results.filter((result): result is IFile => !!result)
                } catch (err) {
                    try {
                        await this.aws.removeFiles(paperwork)
                    } catch (err) {
                        return this.response.sendError(res, StatusCodes.InternalServerError, "Error uploading paperwork(s)")
                    }
                }

                const paperworks = study.paperwork
                let movedPaperwork = [] as IFile[]
                if (paperworks.length > 0) {
                    for (const paperwork of paperworks) {
                        if (paperwork?.path) {
                            const destinationPath = `bin/${paperwork.path}`
                            const url = this.aws.getS3(destinationPath)

                            await this.aws.copyS3(paperwork.path, destinationPath)

                            movedPaperwork.push({
                                url,
                                type: paperwork.type,
                                path: destinationPath,
                            })
                        }
                    }

                    await Promise.all([
                        this.aws.removeFiles(paperworks),
                        this.prisma.trash.create({
                            data: {
                                files: movedPaperwork,
                                center: { connect: { id: centerId } }
                            }
                        })
                    ])
                }
            }

            await this.prisma.patientStudy.update({
                where: { study_id: studyId },
                data: {
                    paperwork,
                    ...body,
                }
            })

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: { studyId },
                message: "Patient study has been updated"
            })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error updating patient study")
        }
    }

    async assignPatientStudy(
        res: Response,
        mrn: string,
        studyId: string,
        practitionerId: string,
        { centerId }: ExpressUser,
    ) {
        try {
            const patient = await this.prisma.patient.findUnique({
                where: { mrn, centerId },
                select: { id: true, fullname: true, mrn: true, status: true },
            })

            if (!patient) {
                return this.response.sendError(res, StatusCodes.NotFound, "Patient not found")
            }

            if (patient.status === "Archived") {
                return this.response.sendError(res, StatusCodes.Forbidden, "Unarchive patient before assigning")
            }

            const study = await this.prisma.patientStudy.findUnique({
                where: { study_id: studyId, patientId: patient.id }
            })

            if (!study) {
                return this.response.sendError(res, StatusCodes.NotFound, "Patient study does not exist")
            }

            const practitioner = await this.prisma.practitioner.findUnique({
                where: { id: practitionerId },
                select: { fullname: true, role: true }
            })

            if (!practitioner) {
                return this.response.sendError(res, StatusCodes.NotFound, "Practitioner does not exist")
            }

            await this.prisma.$transaction([
                this.prisma.practitioner.update({
                    where: { id: practitionerId },
                    data: {
                        patientStudies: {
                            connect: { id: study.id }
                        }
                    }
                }),
                this.prisma.patientStudy.update({
                    where: { study_id: studyId },
                    data: { status: 'Assigned' }
                })
            ])

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: { studyId, patient, practitioner },
                message: `Patient study has been assigned to a ${practitioner.role}`
            })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error assigning patient")
        }
    }
}
