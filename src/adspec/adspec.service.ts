import { Response } from 'express'
import { Injectable } from '@nestjs/common'
import { MiscService } from 'lib/misc.service'
import { StatusCodes } from 'enums/statusCodes'
import { LoginDTO } from 'src/auth/dto/login.dto'
import { PrismaService } from 'lib/prisma.service'
import { ChartDTO } from 'src/center/dto/fetch.dto'
import { InviteDTO, SignupDTO } from './dto/auth.dto'
import { ResponseService } from 'lib/response.service'
import { FetchPractitionersDTO } from './dto/prac.dto'
import { EncryptionService } from 'lib/encryption.service'
import { FetchCentersDTO, ToggleStatusDTO } from './dto/center.dto'

@Injectable()
export class AdspecService {
    constructor(
        private readonly misc: MiscService,
        private readonly prisma: PrismaService,
        private readonly response: ResponseService,
        private readonly encryption: EncryptionService,
    ) { }

    private or(search: string) {
        const OR = [
            { country: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { state: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
        ] as ({
            demographic: {
                country: {
                    contains: string;
                    mode: "insensitive"
                }
            }
        } | {
            email: {
                contains: string
                mode: "insensitive"
            }
        } | {
            demographic: {
                state: {
                    contains: string
                    mode: "insensitive"
                }
            }
        } | {
            demographic: {
                city: {
                    contains: string
                    mode: "insensitive"
                }
            }
        })[]

        return OR
    }

    async signup(res: Response, { email, password, fullname, }: SignupDTO) {
        try {
            const admin = await this.prisma.adspec.findUnique({
                where: { email }
            })

            if (admin) {
                return this.response.sendError(res, StatusCodes.Conflict, `Existing ${admin.role}`)
            }

            password = await this.encryption.hashAsync(password, 12)

            await this.prisma.adspec.create({
                data: { email, password, fullname, role: 'admin', superAdmin: true }
            })

            this.response.sendSuccess(res, StatusCodes.Created, {
                message: "You're now an admin"
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async login(res: Response, { email, password }: LoginDTO) {
        try {
            const adspec = await this.prisma.adspec.findUnique({
                where: { email }
            })

            if (!adspec) {
                return this.response.sendError(res, StatusCodes.NotFound, 'Invalid email or password')
            }

            if (adspec.status === "SUSPENDED") {
                return this.response.sendError(res, StatusCodes.Forbidden, "Your account has been suspended")
            }

            const isMatch = await this.encryption.compareAsync(password, adspec.password)
            if (!isMatch) {
                return this.response.sendError(res, StatusCodes.Unauthorized, 'Incorrect password')
            }

            const access_token = await this.misc.generateNewAccessToken({
                sub: adspec.id,
                role: adspec.role,
                modelName: 'adspec',
                status: adspec.status,
            })

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: {
                    role: adspec.role,
                    email: adspec.email,
                    avatar: adspec.avatar,
                    fullname: adspec.fullname,
                },
                access_token
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async inviteNewAdspec(
        res: Response,
        { sub }: ExpressUser,
        { email, fullname, role, password }: InviteDTO,
    ) {
        try {
            const adspec = await this.prisma.adspec.findUnique({
                where: { id: sub }
            })

            const isExist = await this.prisma.adspec.findUnique({
                where: { email }
            })

            if (isExist) {
                return this.response.sendError(res, StatusCodes.Conflict, "Member with the same email already exists")
            }

            if (!adspec.superAdmin && role === "admin") {
                return this.response.sendError(res, StatusCodes.Forbidden, "Only the Super Admin can invite an Admin")
            }

            const pswd = await this.encryption.hashAsync(password, 12)

            await this.prisma.adspec.create({
                data: {
                    email, fullname,
                    superAdmin: false,
                    role, password: pswd,
                }
            })

            this.response.sendSuccess(res, StatusCodes.Created, {
                message: `A new ${role} has been invited`,
                data: { password }
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async fetchAdspec(res: Response) {
        const adspecs = await this.prisma.adspec.findMany({
            select: {
                id: true,
                email: true,
                status: true,
                createdAt: true,
                fullname: true,
            },
            orderBy: { updatedAt: 'desc' }
        })

        this.response.sendSuccess(res, StatusCodes.OK, { data: adspecs })
    }

    async fetchCenters(
        res: Response,
        {
            limit = 100, page = 1,
            status, sortBy, search = "",
            endDate = '', startDate = '',
        }: FetchCentersDTO
    ) {
        try {
            page = Number(page)
            limit = Number(limit)

            if (isNaN(limit) || isNaN(page) || limit <= 0 || page <= 0) {
                return this.response.sendError(res, StatusCodes.BadRequest, 'Invalid pagination parameters')
            }

            const offset = (page - 1) * limit

            const commonWhere = {
                OR: [
                    { centerName: { contains: search, mode: 'insensitive' } },
                    ...this.or(search),
                ],
                createdAt: {
                    gte: startDate !== '' ? new Date(startDate) : new Date(0),
                    lte: endDate !== '' ? new Date(endDate) : new Date(),
                },
                ...(status ? { status } : {}),
            }

            const centers = await this.prisma.center.findMany({
                // @ts-ignore
                where: commonWhere,
                take: limit,
                skip: offset,
                orderBy: sortBy === "name" ? { centerName: 'asc' } : { createdAt: 'desc' }
            })

            const total = await this.prisma.center.count({
                // @ts-ignore
                where: commonWhere
            })

            const totalPages = Math.ceil(total / limit)
            const hasNext = page < totalPages
            const hasPrev = page > 1

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: centers,
                metadata: {
                    total,
                    totalPages,
                    hasNext,
                    hasPrev,
                    currentPage: page,
                }
            })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error fetching facilities")
        }
    }

    async fetchCenter(res: Response, centerId: string) {
        try {
            const center = await this.prisma.center.findUnique({
                where: { id: centerId },
                include: {
                    admins: {
                        where: { superAdmin: true },
                        select: {
                            demographic: {
                                select: { phone: true },
                            },
                            email: true,
                            avatar: true,
                            fullname: true,
                        }
                    }
                }
            })

            if (!center) {
                return this.response.sendError(res, StatusCodes.NotFound, "Facility not found")
            }

            this.response.sendSuccess(res, StatusCodes.OK, { data: center })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error fetching facility")
        }
    }

    async toggleOrgStatus(
        res: Response,
        centerId: string,
        { status }: ToggleStatusDTO
    ) {
        try {
            const center = await this.prisma.center.findUnique({
                where: { id: centerId }
            })

            if (!center) {
                return this.response.sendError(res, StatusCodes.NotFound, 'Facility not found')
            }

            await this.prisma.$transaction([
                this.prisma.center.update({
                    where: { id: centerId },
                    data: { status }
                }),
                this.prisma.centerAdmin.updateMany({
                    where: { centerId, superAdmin: true },
                    data: { status }
                })
            ])

            // TODO: mail about status change

            this.response.sendSuccess(res, StatusCodes.OK, {
                message: `The center is now ${status.toLowerCase()}`
            })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error toggling facility")
        }
    }

    async fetchPractitioners(
        res: Response,
        {
            limit = 100, page = 1, role,
            status, sortBy, search = '',
            endDate = '', startDate = '',
        }: FetchPractitionersDTO
    ) {
        try {
            page = Number(page)
            limit = Number(limit)

            if (isNaN(limit) || isNaN(page) || limit <= 0 || page <= 0) {
                return this.response.sendError(res, StatusCodes.BadRequest, 'Invalid pagination parameters')
            }

            const offset = (page - 1) * limit

            const practitioners = await this.prisma.practitioner.findMany({
                where: {
                    role,
                    ...status ? { status } : {},
                    createdAt: {
                        gte: startDate !== '' ? new Date(startDate) : new Date(0),
                        lte: endDate !== '' ? new Date(endDate) : new Date(),
                    },
                    type: 'system',
                    OR: [
                        { fullname: { contains: search, mode: 'insensitive' } },
                        ...this.or(search)
                    ]
                },
                take: limit,
                skip: offset,
                orderBy: sortBy === "name" ? { fullname: 'asc' } : { createdAt: 'desc' }
            })

            const total = await this.prisma.practitioner.count({
                where: {
                    type: 'system',
                    ...status ? { status } : {},
                    createdAt: {
                        gte: startDate !== '' ? new Date(startDate) : new Date(0),
                        lte: endDate !== '' ? new Date(endDate) : new Date(),
                    },
                }
            })

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: { practitioners, total }
            })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error fetching practitioners")
        }
    }

    async fetchPractitioner(res: Response, practitionerId: string) {
        try {
            const practitioner = await this.prisma.practitioner.findUnique({
                where: { id: practitionerId, type: 'system' },
            })

            if (!practitioner) {
                return this.response.sendError(res, StatusCodes.NotFound, 'Practitioner not found')
            }

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: practitioner
            })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error getting practitioner")
        }
    }

    async togglePractitionerStatus(
        res: Response,
        practitionerId: string,
        { status }: ToggleStatusDTO
    ) {
        try {
            const practitioner = await this.prisma.practitioner.findUnique({
                where: { id: practitionerId }
            })

            if (!practitioner) {
                return this.response.sendError(res, StatusCodes.NotFound, 'Facility not found')
            }

            await this.prisma.practitioner.update({
                where: { id: practitionerId },
                data: { status }
            })

            // TODO: mail about status change

            this.response.sendSuccess(res, StatusCodes.OK, {
                message: `The ${practitioner.role} is now ${practitioner.status}`
            })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error toggling status")
        }
    }

    async analytics(res: Response) {
        try {
            const [
                patientCounts, facilityCounts,
                caseStudyCounts, caseStudies,
            ] = await this.prisma.$transaction([
                this.prisma.patient.count(),
                this.prisma.center.count(),
                this.prisma.patientStudy.count(),
                this.prisma.patientStudy.findMany({
                    select: { dicoms: true }
                }),
            ])

            let totalDicomCounts = 0
            await Promise.all(caseStudies.map(async (patient) => {
                const dicomCounts = await Promise.all(patient.dicoms.map(async (dicom) => {
                    // @ts-ignore
                    if (dicom?.path) {
                        return 1
                    } else {
                        return 0
                    }
                }))
                totalDicomCounts += dicomCounts.reduce((total, count) => total + count, 0)
            }))

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: { patientCounts, totalDicomCounts, facilityCounts, caseStudyCounts }
            })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error calculating analytics")
        }
    }

    async charts(
        res: Response,
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

                    const count = await this.prisma.patient.count({
                        where: {
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

                    const count = await this.prisma.patient.count({
                        where: {
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
}
