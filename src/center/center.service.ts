import { Response } from 'express'
import { Injectable } from '@nestjs/common'
import { StatusCodes } from 'enums/statusCodes'
import { MiscService } from 'lib/misc.service'
import { PrismaService } from 'lib/prisma.service'
import { ResponseService } from 'lib/response.service'
import { FetchMedicalStaffDto } from './dto/fetch.dto'
import { SuspendMedicalStaffDto } from './dto/auth.dto'

@Injectable()
export class CenterService {
    constructor(
        private readonly misc: MiscService,
        private readonly prisma: PrismaService,
        private readonly response: ResponseService,
    ) { }

    async fetchMedicalStaffs(
        res: Response,
        { sub }: ExpressUser,
        { limit = 50, page = 1, search = '', role, sortBy }: FetchMedicalStaffDto
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

    async suspendMedicalStaff(
        res: Response,
        staffId: string,
        { sub }: ExpressUser,
        { action }: SuspendMedicalStaffDto
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
}
