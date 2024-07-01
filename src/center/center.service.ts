import { Response } from 'express'
import { validateFile } from 'utils/file'
import { Injectable } from '@nestjs/common'
import * as dicomParser from 'dicom-parser'
import { AwsService } from 'lib/aws.service'
import { AddPatientDTO } from './dto/patient'
import { MiscService } from 'lib/misc.service'
import { StatusCodes } from 'enums/statusCodes'
import {
    InviteCenterAdminDTO, InviteMedicalStaffDTO
} from './dto/invite.dto'
import { SuspendStaffDTO } from './dto/auth.dto'
import { PrismaService } from 'lib/prisma.service'
import { ResponseService } from 'lib/response.service'
import { EncryptionService } from 'lib/encryption.service'
import { $Enums, Roles, StudyStatus } from '@prisma/client'
import { genFilename, genPassword } from 'helpers/generator'
import {
    DesignateStudyDTO, EditPatientStudyDTO, PatientStudyDTO
} from './dto/study.dto'
import { toUpperCase, transformMRN } from 'helpers/transformer'
import {
    ChartDTO, FetchPatientDTO, FetchPatientStudyDTO, FetchStaffDTO
} from './dto/fetch.dto'

@Injectable()
export class CenterService {
    constructor(
        private readonly aws: AwsService,
        private readonly misc: MiscService,
        private readonly prisma: PrismaService,
        private readonly response: ResponseService,
        private readonly encryption: EncryptionService,
    ) { }

    private async isNotAccessibleForPractitioner(sub: string, patientId: string) {
        let isAccessible = false

        const practitioner = await this.prisma.practitioner.findUnique({
            where: { id: sub }
        })

        if (!practitioner) return

        if (practitioner.type === 'center' && practitioner.role === "radiologist") {
            isAccessible = true
        }

        if (practitioner.type === 'system' || practitioner.role === "doctor") {
            const studiesCount = await this.prisma.patientStudy.count({
                where: {
                    patientId,
                    practitionerId: practitioner.id
                }
            })
            isAccessible = studiesCount === 0
        }

        return isAccessible
    }

    async fetchStaffs(
        res: Response,
        { centerId }: ExpressUser,
        {
            limit = 50, page = 1,
            role, search = '', sortBy
        }: FetchStaffDTO
    ) {
        try {
            page = Number(page)
            limit = Number(limit)

            if (isNaN(limit) || isNaN(page) || limit <= 0 || page <= 0) {
                return this.response.sendError(res, StatusCodes.BadRequest, 'Invalid pagination parameters')
            }

            const offset = (page - 1) * limit

            const whereCondition = {
                role,
                centerId,
                OR: [
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                    { fullname: { contains: search, mode: 'insensitive' } },
                ]
            }

            const data = await (this.prisma[role === "centerAdmin" ? 'centerAdmin' : 'practitioner'] as any).findMany({
                where: whereCondition,
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

            const total = await (this.prisma[role === "centerAdmin" ? 'centerAdmin' : 'practitioner'] as any).count({
                where: whereCondition,
            })

            const totalPages = Math.ceil(total / limit)
            const hasNext = page < totalPages
            const hasPrev = page > 1

            this.response.sendSuccess(res, StatusCodes.OK, {
                data,
                metadata: {
                    total,
                    totalPages,
                    hasNext,
                    hasPrev,
                    currentPage: page,
                }
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async suspendStaff(
        res: Response,
        staffId: string,
        { sub, centerId }: ExpressUser,
        { action }: SuspendStaffDTO,
    ) {
        try {
            const admin = await this.prisma.centerAdmin.findUnique({
                where: { id: sub }
            })

            const centerAdmin = await this.prisma.centerAdmin.findUnique({
                where: { id: staffId, centerId }
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
            password, practiceNumber, city,
            profession, email, state, address,
            country, zip_code, fullname, phone,
        }: InviteMedicalStaffDTO
    ) {
        try {
            const isExists = await this.prisma.practitioner.findFirst({
                where: {
                    centerId,
                    OR: [
                        { email: { equals: email, mode: 'insensitive' } },
                        { practiceNumber: { equals: practiceNumber, mode: 'insensitive' } },
                    ]
                }
            })

            if (isExists) {
                return this.response.sendError(res, StatusCodes.Conflict, "Email or practice number already exist")
            }

            const pswd = await this.encryption.hashAsync(password, 12)

            await this.prisma.practitioner.create({
                data: {
                    type: 'center', state, address,
                    center: { connect: { id: centerId } },
                    city, country, email, fullname, phone,
                    zip_code, status: 'ACTIVE', password: pswd,
                    role: profession as Roles, practiceNumber,
                }
            })

            this.response.sendSuccess(res, StatusCodes.OK, {
                message: `A new ${profession} has been invited`,
                data: { password }
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async inviteCenterAdmin(
        res: Response,
        { sub, centerId }: ExpressUser,
        { email, fullname, phone, password }: InviteCenterAdminDTO
    ) {
        try {
            const admin = await this.prisma.centerAdmin.findUnique({
                where: { id: sub, superAdmin: true, centerId },
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

            const pswd = await this.encryption.hashAsync(password, 12)

            await this.prisma.centerAdmin.create({
                data: {
                    email, fullname, phone, password: pswd,
                    center: { connect: { id: centerId } }
                }
            })

            this.response.sendSuccess(res, StatusCodes.OK, {
                message: "A new center admin has been invited",
                data: { password }
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

            const chart: { label: string; count: string }[] = []

            if (q === "weekdays") {
                labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
                const today = new Date()
                const startOfWeek = today.getDate() - today.getDay() + 1
                for (let i = 0; i < 7; i++) {
                    const startDate = new Date(today.setDate(startOfWeek + i))
                    const endDate = new Date(today.setDate(startOfWeek + i + 1))

                    const count = await this.prisma.patientStudy.count({
                        where: {
                            centerId,
                            createdAt: {
                                gte: startDate,
                                lt: endDate
                            }
                        }
                    })
                    chart.push({ label: labels[i], count: count.toString() })
                    total += count
                }
            } else if (q === "monthly") {
                for (let i = 0; i < labels.length; i++) {
                    const startDate = new Date(currentYear, i, 1)
                    const endDate = new Date(currentYear, i + 1, 1)

                    const count = await this.prisma.patientStudy.count({
                        where: {
                            centerId,
                            createdAt: {
                                gte: startDate,
                                lt: endDate
                            }
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
            const patient = await this.prisma.patient.findFirst({
                where: {
                    centerId: centerId,
                    OR: [
                        { email: email },
                        { phone: phone },
                        { nin: nin },
                    ],
                },
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
                message: "Patient has been updated"
            })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error updating patient record")
        }
    }

    async getPatient(
        res: Response,
        mrn: string,
        { sub, centerId, role }: ExpressUser,
    ) {
        try {
            const patient = await this.prisma.patient.findUnique({
                where: { mrn, centerId }
            })

            if (!patient) {
                return this.response.sendError(res, StatusCodes.NotFound, `Patient does not exist`)
            }

            if (role === "doctor" || role === "radiologist") {
                const isNotAccessible = this.isNotAccessibleForPractitioner(sub, patient.id)

                if (isNotAccessible) {
                    return this.response.sendError(res, StatusCodes.Forbidden, "Access denied")
                }
            }

            this.response.sendSuccess(res, StatusCodes.OK, { data: patient })
        } catch (err) {
            this.misc.handleServerError(res, err, "Something went wrong while getting a patient record")
        }
    }

    async createPatientStudy(
        res: Response,
        mrn: string,
        {
            access_code, body_part, cpt_code,
            clinical_info, description, procedure,
            priority, reporting_status, site, modality,
        }: PatientStudyDTO,
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
                        const re = validateFile(file, 5 << 20, 'pdf', 'docx', 'png', 'jpg', 'jpeg')

                        if (re?.status) {
                            return this.response.sendError(res, re.status, re.message)
                        }

                        const path = `${centerId}/${mrn}/${genFilename(re.file)}`
                        await this.aws.uploadS3(file, path)

                        return {
                            type: re.file.mimetype,
                            path, size: re.file.size,
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

            const data = await this.prisma.patientStudy.create({
                data: {
                    study_id: toUpperCase(studyId),
                    paperwork, status: 'Unassigned',
                    access_code, body_part, cpt_code,
                    clinical_info, description, procedure,
                    center: { connect: { id: centerId } },
                    patient: { connect: { id: patient.id } },
                    priority, reporting_status, site, modality,
                }
            })

            this.response.sendSuccess(res, StatusCodes.OK, {
                data,
                message: "Patient Study has been added"
            })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error creating a patient study")
        }
    }

    async editPatientStudy(
        res: Response,
        studyId: string,
        {
            access_code, body_part, cpt_code,
            clinical_info, description, procedure,
            priority, reporting_status, site, modality,
        }: EditPatientStudyDTO,
        { centerId }: ExpressUser,
        files: Array<Express.Multer.File>,
    ) {
        try {
            const study = await this.prisma.patientStudy.findUnique({
                where: { study_id: studyId, centerId },
                include: { patient: true }
            })

            if (!study) {
                return this.response.sendError(res, StatusCodes.NotFound, "Patient study not found")
            }

            if (study.patient.status === "Archived") {
                return this.response.sendError(res, StatusCodes.Forbidden, "You need to unarchive the patient before editing..")
            }

            const mrn = study.patient.mrn
            if (study.patient.centerId !== centerId) {
                return this.response.sendError(res, StatusCodes.Unauthorized, "Seek the permission to edit")
            }

            let paperwork: IFile[] = []
            if (files?.length) {
                try {
                    const results = await Promise.all(files.map(async file => {
                        const re = validateFile(file, 5 << 20, 'pdf', 'docx', 'png', 'jpg', 'jpeg')

                        if (re?.status) {
                            return this.response.sendError(res, re.status, re.message)
                        }

                        const path = `${centerId}/${mrn}/${genFilename(re.file)}`
                        await this.aws.uploadS3(file, path)

                        return {
                            type: re.file.mimetype,
                            path, size: re.file.size,
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
                                size: paperwork.size,
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

            const data = await this.prisma.patientStudy.update({
                where: { study_id: study.study_id },
                data: {
                    paperwork,
                    access_code, body_part, cpt_code,
                    clinical_info, description, procedure,
                    priority, reporting_status, site, modality,
                }
            })

            this.response.sendSuccess(res, StatusCodes.OK, {
                data,
                message: "Patient study has been updated"
            })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error updating patient study")
        }
    }

    async fetchPatients(
        res: Response,
        { sub, role, centerId }: ExpressUser,
        {
            limit = 100, page = 1,
            status, sortBy, search = '',
            endDate = '', startDate = '',
        }: FetchPatientDTO,
    ) {
        try {
            page = Number(page)
            limit = Number(limit)

            if (isNaN(limit) || isNaN(page) || limit <= 0 || page <= 0) {
                return this.response.sendError(res, StatusCodes.BadRequest, 'Invalid pagination parameters')
            }

            let patients = []
            let totalCount = 0

            if (role === "radiologist" || role === "doctor") {
                const { patients: fetchedPatients, totalCount: fetchedTotalCount } = await this.fetchPatientsByPractitioner(sub, centerId, status, sortBy, search, startDate, endDate, limit, page)
                patients = fetchedPatients
                totalCount = fetchedTotalCount
            } else {
                const { patients: fetchedPatients, totalCount: fetchedTotalCount } = await this.fetchAllPatients(centerId, status, sortBy, search, startDate, endDate, limit, page)
                patients = fetchedPatients
                totalCount = fetchedTotalCount
            }

            const totalPages = Math.ceil(totalCount / limit)
            const hasNext = page < totalPages
            const hasPrev = page > 1

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: patients,
                metadata: {
                    totalCount,
                    totalPages,
                    hasNext,
                    hasPrev,
                    currentPage: page,
                }
            })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error fetching patients")
        }
    }

    private async fetchPatientsByPractitioner(practitionerId: string, centerId: string, status: $Enums.PatientStatus, sortBy: string, search: string, startDate: string, endDate: string, limit: number, page: number) {
        const offset = (page - 1) * limit

        const dateFilter = {
            gte: startDate !== '' ? new Date(startDate) : new Date(0),
            lte: endDate !== '' ? new Date(endDate) : new Date(),
        }

        const practitioner = await this.getPractitioner(practitionerId)

        let patientStudies: {
            patientId: string
        }[] = []

        if (practitioner.type === 'center' && practitioner.role === "radiologist") {
            patientStudies = await this.prisma.patientStudy.findMany({
                where: {
                    centerId,
                    updatedAt: dateFilter,
                },
                select: { patientId: true },
            })
        }

        if (practitioner.type === 'system' || practitioner.role === "doctor") {
            patientStudies = await this.prisma.patientStudy.findMany({
                where: {
                    centerId,
                    practitionerId,
                    updatedAt: dateFilter,
                },
                select: { patientId: true },
            })
        }

        const patientIdsSet = new Set(patientStudies.map(ps => ps.patientId))
        const patientIds = Array.from(patientIdsSet)

        const totalCount = await this.prisma.patient.count({
            where: {
                id: { in: patientIds },
                ...status ? { status } : {},
                OR: [
                    { fullname: { contains: search, mode: 'insensitive' } },
                    { mrn: { contains: search, mode: 'insensitive' } },
                    { nin: { contains: search, mode: 'insensitive' } },
                    { address: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                ],
                createdAt: dateFilter
            }
        })

        const patients = await this.prisma.patient.findMany({
            where: {
                id: { in: patientIds },
                ...status ? { status } : {},
                OR: [
                    { fullname: { contains: search, mode: 'insensitive' } },
                    { mrn: { contains: search, mode: 'insensitive' } },
                    { nin: { contains: search, mode: 'insensitive' } },
                    { address: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                ],
                createdAt: dateFilter
            },
            take: limit,
            skip: offset,
            select: {
                id: true,
                mrn: true,
                dob: true,
                email: true,
                phone: true,
                gender: true,
                status: true,
                fullname: true,
            },
            orderBy: sortBy === "name" ? { fullname: 'asc' } : { updatedAt: 'desc' },
        })

        return { patients, totalCount }
    }

    private async fetchAllPatients(centerId: string, status: $Enums.PatientStatus, sortBy: string, search: string, startDate: string, endDate: string, limit: number, page: number) {
        const offset = (page - 1) * limit

        const dateFilter = {
            gte: startDate !== '' ? new Date(startDate) : new Date(0),
            lte: endDate !== '' ? new Date(endDate) : new Date(),
        }

        const totalCount = await this.prisma.patient.count({
            where: {
                ...status ? { status } : {},
                centerId,
                OR: [
                    { fullname: { contains: search, mode: 'insensitive' } },
                    { mrn: { contains: search, mode: 'insensitive' } },
                    { nin: { contains: search, mode: 'insensitive' } },
                    { address: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                ],
                updatedAt: dateFilter,
            }
        })

        const patients = await this.prisma.patient.findMany({
            where: {
                ...status ? { status } : {},
                centerId,
                OR: [
                    { fullname: { contains: search, mode: 'insensitive' } },
                    { mrn: { contains: search, mode: 'insensitive' } },
                    { nin: { contains: search, mode: 'insensitive' } },
                    { address: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                ],
                updatedAt: dateFilter,
            },
            take: limit,
            skip: offset,
            select: {
                id: true,
                mrn: true,
                dob: true,
                email: true,
                phone: true,
                gender: true,
                status: true,
                fullname: true,
            },
            orderBy: sortBy === "name" ? { fullname: 'asc' } : { updatedAt: 'desc' },
        })

        return { patients, totalCount }
    }

    async fetchAllPatientStudies(
        res: Response,
        { sub, role, centerId }: ExpressUser,
        {
            priority, status, search = '',
            modality, sortBy, startDate = '',
            limit = 100, page = 1, endDate = '',
        }: FetchPatientStudyDTO,
    ) {
        try {
            page = Number(page)
            limit = Number(limit)
            const offset = (page - 1) * limit

            if (isNaN(limit) || isNaN(page) || limit <= 0 || page <= 0) {
                return this.response.sendError(res, StatusCodes.BadRequest, 'Invalid pagination parameters')
            }

            let total = 0
            let patientStudies = []

            const dateFilter = {
                gte: startDate !== '' ? new Date(startDate) : new Date(0),
                lte: endDate !== '' ? new Date(endDate) : new Date(),
            }

            const searchFilter = [
                { body_part: { contains: search, mode: 'insensitive' } },
                { access_code: { contains: search, mode: 'insensitive' } },
                { clinical_info: { contains: search, mode: 'insensitive' } },
                { patient: { mrn: { contains: search, mode: 'insensitive' } } },
                { patient: { fullname: { contains: search, mode: 'insensitive' } } },
            ]

            const commonWhereConditions = {
                centerId,
                ...status && { status },
                modality: modality ?? undefined,
                priority: priority ?? undefined,
                updatedAt: dateFilter,
            }

            if (role === "radiologist" || role === "doctor") {
                patientStudies = await this.fetchStudiesByPractitioner(sub, commonWhereConditions, searchFilter, sortBy, limit, offset)
                total = await this.getTotalCountByPractitioner(sub, commonWhereConditions, searchFilter)
            } else {
                patientStudies = await this.fetchAllStudies(commonWhereConditions, searchFilter, sortBy, limit, offset)
                total = await this.getTotalCount(commonWhereConditions, searchFilter)
            }

            const totalPages = Math.ceil(total / limit)
            const hasNext = page < totalPages
            const hasPrev = page > 1

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: patientStudies,
                metadata: {
                    total,
                    totalPages,
                    hasNext,
                    hasPrev,
                    currentPage: page,
                }
            })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error fetching reports")
        }
    }

    private async getPractitioner(id: string) {
        return await this.prisma.practitioner.findUnique({ where: { id } })
    }

    private async fetchStudiesByPractitioner(practitionerId: string, commonWhereConditions: any, searchFilter: any[], sortBy: string, limit: number, offset: number) {
        const practitioner = await this.getPractitioner(practitionerId)

        let where: any

        if (practitioner.type === 'center' && practitioner.role === "radiologist") {
            where = {
                ...commonWhereConditions,
                OR: searchFilter,
            }
        }
        if (practitioner.type === 'system' || practitioner.role === "doctor") {
            where = {
                practitionerId,
                ...commonWhereConditions,
                OR: searchFilter,
            }
        }

        return await this.prisma.patientStudy.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: sortBy === "name" ? { body_part: 'asc' } : { updatedAt: 'desc' },
            include: {
                patient: {
                    select: {
                        mrn: true,
                        dob: true,
                        gender: true,
                        fullname: true,
                    },
                },
            },
        })
    }

    private async getTotalCountByPractitioner(practitionerId: string, commonWhereConditions: any, searchFilter: any[]) {
        const practitioner = await this.getPractitioner(practitionerId)

        let where: any

        if (practitioner.type === 'center' && practitioner.role === "radiologist") {
            where = {
                ...commonWhereConditions,
                OR: searchFilter,
            }
        }
        if (practitioner.type === 'system' || practitioner.role === "doctor") {
            where = {
                practitionerId,
                ...commonWhereConditions,
                OR: searchFilter,
            }
        }

        return await this.prisma.patientStudy.count({ where })
    }

    private async fetchAllStudies(commonWhereConditions: any, searchFilter: any[], sortBy: string, limit: number, offset: number) {
        return await this.prisma.patientStudy.findMany({
            where: {
                ...commonWhereConditions,
                OR: searchFilter,
            },
            take: limit,
            skip: offset,
            orderBy: sortBy === "name" ? { body_part: 'asc' } : { updatedAt: 'desc' },
            include: {
                patient: {
                    select: {
                        mrn: true,
                        dob: true,
                        gender: true,
                        fullname: true,
                    },
                },
            },
        })
    }

    private async getTotalCount(commonWhereConditions: any, searchFilter: any[]) {
        return await this.prisma.patientStudy.count({
            where: {
                ...commonWhereConditions,
                OR: searchFilter,
            },
        })
    }

    async fetchPatientStudies(
        mrn: string,
        res: Response,
        { sub, role, centerId }: ExpressUser,
    ) {
        try {
            let where: any
            const practitioner = await this.getPractitioner(sub)

            if (role === "centerAdmin" || (practitioner.type === 'center' && practitioner.role === "radiologist")) {
                where = {
                    centerId,
                    patient: { mrn }
                }
            } else {
                if (practitioner.type === 'system' || practitioner.role === "doctor") {
                    where = {
                        centerId,
                        patient: { mrn },
                        practitionerId: sub,
                    }
                }
            }

            const studies = await this.prisma.patientStudy.findMany({
                where,
                include: {
                    patient: {
                        select: {
                            mrn: true,
                            dob: true,
                            gender: true,
                            fullname: true,
                        },
                    },
                },
            })

            this.response.sendSuccess(res, StatusCodes.OK, { data: studies })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async designatePatientStudy(
        res: Response,
        mrn: string,
        studyId: string,
        practitionerId: string,
        { centerId }: ExpressUser,
        { action }: DesignateStudyDTO,
    ) {
        try {
            const patient = await this.prisma.patient.findUnique({
                where: { mrn, centerId },
                select: {
                    mrn: true, status: true,
                    id: true, fullname: true,
                },
            })

            if (!patient) {
                return this.response.sendError(res, StatusCodes.NotFound, "Patient not found")
            }

            if (patient.status === "Archived") {
                return this.response.sendError(res, StatusCodes.Forbidden, "Unarchive the patient before assigning")
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
                        patientStudies: action === "Assigned" ? {
                            connect: { id: study.id }
                        } : {
                            disconnect: { id: study.id }
                        }
                    }
                }),
                this.prisma.patientStudy.update({
                    where: { study_id: studyId },
                    data: { status: action }
                })
            ])

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: { studyId, patient, practitioner },
                message: `Patient study has been ${action} to ${practitioner.fullname}`
            })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error assigning patient")
        }
    }

    async getPatientStudy(
        res: Response,
        { sub, centerId, role }: ExpressUser,
        mrn: string,
        studyId: string
    ) {
        try {
            const patient = await this.prisma.patient.findUnique({
                where: { mrn, centerId }
            })

            const study = await this.prisma.patientStudy.findUnique({
                where: {
                    study_id: studyId,
                    patientId: patient.id,
                },
                include: {
                    patient: {
                        select: {
                            mrn: true,
                            dob: true,
                            gender: true,
                            fullname: true,
                        },
                    },
                },
            })

            if (!study) {
                return this.response.sendError(res, StatusCodes.NotFound, "Patient Study not found")
            }

            if (role === "radiologist" || role === "doctor") {
                const isNotAccessible = this.isNotAccessibleForPractitioner(sub, patient.id)

                if (isNotAccessible) {
                    return this.response.sendError(res, StatusCodes.Forbidden, "You do not have access to this patient's record")
                }

                res.on('finish', async () => {
                    await this.prisma.patientStudy.update({
                        where: { study_id: studyId },
                        data: { status: 'Opened' }
                    })
                })
            }

            this.response.sendSuccess(res, StatusCodes.OK, { data: study })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async uploadDicomFiles(
        res: Response,
        studyId: string,
        { centerId }: ExpressUser,
        files: Array<Express.Multer.File>
    ) {
        try {
            const study = await this.prisma.patientStudy.findUnique({
                where: {
                    centerId,
                    study_id: studyId,
                }
            })

            if (!study) {
                return this.response.sendError(res, StatusCodes.NotFound, "Patient study not found")
            }

            let dicoms: IFile[] = []
            if (files?.length) {
                try {
                    for (const file of files) {
                        const preliminaryDataSet = dicomParser.parseDicom(file.buffer, { untilTag: 'x00020010' })

                        const transferSyntaxUid = preliminaryDataSet.string('x00020010')

                        console.log(transferSyntaxUid)

                        const dataSet = dicomParser.parseDicom(file.buffer, { TransferSyntaxUID: transferSyntaxUid })

                        const obj = {
                            patientName: dataSet.string('x00100010'),
                            patientID: dataSet.string('x00100020'),
                            studyDate: dataSet.string('x00080020'),
                            modality: dataSet.string('x00080060'),
                            studyDescription: dataSet.string('x00081030'),
                            seriesDescription: dataSet.string('x0008103e'),
                            institutionName: dataSet.string('x00080080'),
                            referringPhysicianName: dataSet.string('x00080090'),
                            patientBirthDate: dataSet.string('x00100030'),
                            patientSex: dataSet.string('x00100040'),
                            bodyPartExamined: dataSet.string('x00180015'),
                        }

                        console.log(obj)
                    }

                    // const results = await Promise.all(files.map(async file => {
                    //     const re = validateFile(file, 50 << 20, 'dcm', 'dicom')

                    //     if (re?.status) {
                    //         return this.response.sendError(res, re.status, re.message)
                    //     }

                    //     const path = `${centerId}/${studyId}/${genFilename(re.file)}`
                    //     await this.aws.uploadS3(file, path)

                    //     return {
                    //         type: re.file.mimetype,
                    //         path, size: re.file.size,
                    //         url: this.aws.getS3(path)
                    //     }
                    // }))

                    // dicoms = results.filter((result): result is IFile => !!result)
                } catch (err) {
                    console.error(err)
                    // try {
                    //     await this.aws.removeFiles(dicoms)
                    // } catch (err) {
                    //     this.misc.handleServerError(res, err, "Something went wrong while uploading DICOM Files")
                    //     return
                    // }
                }
            }

            await this.prisma.patientStudy.update({
                where: { study_id: studyId },
                data: { dicoms }
            })

            this.response.sendSuccess(res, StatusCodes.OK, { data: dicoms })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error upload DICOM Files")
        }
    }

    async bin(res: Response, { centerId }: ExpressUser) {
        const trash = await this.prisma.trash.findMany({
            where: { centerId }
        })

        this.response.sendSuccess(res, StatusCodes.OK, { data: trash })
    }

    async reportAnalytics(
        res: Response,
        { sub, centerId, role }: ExpressUser
    ) {
        try {
            const labels = ['All', 'Assigned', 'Closed', 'Opened', 'Unassigned']
            let data: {
                label: string
                count: number
            }[] = []

            for (const label of labels) {
                const commonWhere: {
                    centerId: string
                    status: $Enums.StudyStatus
                } = {
                    centerId,
                    status: label === 'All' ? undefined : label as StudyStatus
                }

                const count = await this.prisma.patientStudy.count({
                    where: role === "centerAdmin" ? commonWhere : {
                        ...commonWhere,
                        practitionerId: sub,
                    }
                })

                data.push({ label, count })
            }

            this.response.sendSuccess(res, StatusCodes.OK, { data })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }
}
