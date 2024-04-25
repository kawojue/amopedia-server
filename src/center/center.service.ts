import { Response } from 'express'
import { Injectable } from '@nestjs/common'
import { MiscService } from 'lib/misc.service'
import { FetchStaffDto } from './dto/fetch.dto'
import { StatusCodes } from 'enums/statusCodes'
import { SuspendStaffDto } from './dto/auth.dto'
import { PrismaService } from 'lib/prisma.service'
import { ResponseService } from 'lib/response.service'
import { InviteCenterAdminDTO, InviteMedicalStaffDTO } from './dto/invite.dto'
import { EncryptionService } from 'lib/encryption.service'
import { genPassword } from 'helpers/generator'
import { Roles } from '@prisma/client'

@Injectable()
export class CenterService {
    constructor(
        private readonly misc: MiscService,
        private readonly prisma: PrismaService,
        private readonly response: ResponseService,
        private readonly encryption: EncryptionService,
    ) { }

    async fetchStaffs(
        res: Response,
        { sub }: ExpressUser,
        { limit = 50, page = 1, search = '', role, sortBy }: FetchStaffDto
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
        { sub }: ExpressUser,
        { action }: SuspendStaffDto
    ) {
        try {
            const admin = await this.prisma.centerAdmin.findUnique({
                where: { id: sub }
            })

            const centerAdmin = await this.prisma.centerAdmin.findUnique({
                where: { id: staffId }
            })

            const practitioner = await this.prisma.centerPractitioner.findUnique({
                where: { id: staffId }
            })

            let modelName: string

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
            } else {
                modelName = "centerPractitioner"
            }

            await this.prisma[modelName].update({
                where: { id: staffId },
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

            const practitioner = await this.prisma.centerPractitioner.create({
                data: {
                    zip_code, state, address, city,
                    country, email, fullname, phone,
                    practiceNumber, status: 'ACTIVE',
                    password, role: profession as Roles,
                    center: { connect: { id: centerId } }
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
            const patientCounts = await this.prisma.patient.count({ where: { centerId } })

            const patients = await this.prisma.patient.findMany({
                where: { centerId },
                select: { dicoms: true }
            })

            const dicomCounts = await Promise.all(patients.map(async (patient) => {
                let count = 0
                await Promise.all(patient.dicoms.map(async (dicom) => {
                    if (dicom?.path) {
                        count++
                    }
                }))
                return count
            }))

            const totalDicomCounts = dicomCounts.reduce((total, count) => total + count, 0)

            this.response.sendSuccess(res, StatusCodes.OK, { data: { patientCounts, totalDicomCounts } })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error calculating analytics")
        }
    }

    async chart(res: Response, { centerId }: ExpressUser) {
        try {

        } catch (err) {
            this.misc.handleServerError(res, err, "Error caching chart")
        }
    }
}
