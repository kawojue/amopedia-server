import { Response } from 'express'
import { Center } from '@prisma/client'
import { Injectable } from '@nestjs/common'
import { MiscService } from 'lib/misc.service'
import { genPassword } from 'helpers/generator'
import { StatusCodes } from 'enums/statusCodes'
import { LoginDto } from 'src/auth/dto/login.dto'
import { PrismaService } from 'lib/prisma.service'
import { ChartDTO } from 'src/center/dto/fetch.dto'
import { InviteDto, SignupDto } from './dto/auth.dto'
import { ResponseService } from 'lib/response.service'
import { FetchPractitionersDTO } from './dto/prac.dto'
import { EncryptionService } from 'lib/encryption.service'
import { titleText, toLowerCase } from 'helpers/transformer'
import { FetchOrganizationsDTO, ToggleStatusDTO } from './dto/org.dto'

@Injectable()
export class AdradospecService {
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
            country: {
                contains: string
                mode: "insensitive"
            }
        } | {
            email: {
                contains: string
                mode: "insensitive"
            }
        } | {
            state: {
                contains: string
                mode: "insensitive"
            }
        } | {
            city: {
                contains: string
                mode: "insensitive"
            }
        })[]

        return OR
    }

    async signup(res: Response, { email, password, fullname }: SignupDto) {
        try {
            email = toLowerCase(email)
            fullname = titleText(fullname)

            const admin = await this.prisma.adradospec.findUnique({
                where: { email }
            })

            if (admin) {
                return this.response.sendError(res, StatusCodes.Conflict, `Existing ${admin.role}`)
            }

            password = await this.encryption.hashAsync(password, 12)

            await this.prisma.adradospec.create({
                data: { email, password, fullname, role: 'admin', superAdmin: true }
            })

            this.response.sendSuccess(res, StatusCodes.Created, {
                message: "You're now an admin"
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async login(res: Response, { email, password }: LoginDto) {
        try {
            const adradospec = await this.prisma.adradospec.findUnique({
                where: { email: toLowerCase(email) }
            })

            if (!adradospec) {
                return this.response.sendError(res, StatusCodes.NotFound, 'Invalid email or password')
            }

            const isMatch = await this.encryption.compareAsync(password, adradospec.password)
            if (!isMatch) {
                return this.response.sendError(res, StatusCodes.Unauthorized, 'Incorrect password')
            }

            const access_token = await this.misc.generateNewAccessToken({
                sub: adradospec.id,
                role: adradospec.role,
                modelName: 'adradospec',
                status: adradospec.status,
            })

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: { fullname: adradospec.fullname },
                access_token
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async inviteNewAdrasdospec(
        res: Response,
        { role: authRole, sub }: ExpressUser,
        { email, fullname, role }: InviteDto,
    ) {
        try {
            email = toLowerCase(email)

            const adradospec = await this.prisma.adradospec.findUnique({
                where: { id: sub }
            })

            if ((authRole !== "admin" && !adradospec.superAdmin) && role === "admin") {
                return this.response.sendError(res, StatusCodes.Forbidden, "Only the Super Admin can invite an Admin")
            }

            const pswd = await genPassword()
            const password = await this.encryption.hashAsync(pswd, 12)

            const newAdradospec = await this.prisma.adradospec.create({
                data: {
                    role, password,
                    email, fullname,
                    superAdmin: false,
                }
            })

            if (newAdradospec) {
                // Todo: mail new password - pswd
            }

            this.response.sendSuccess(res, StatusCodes.Created, {
                message: `A new ${role} has been invited`
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async fetchAdradospec(res: Response) {
        const adradospecs = await this.prisma.adradospec.findMany({
            select: {
                id: true,
                email: true,
                status: true,
                createdAt: true,
                fullname: true,
            },
            orderBy: { createdAt: 'desc' }
        })

        this.response.sendSuccess(res, StatusCodes.OK, { data: adradospecs })
    }

    async fetchOrganizations(
        res: Response,
        {
            limit = 100, page = 1,
            status, sortBy, search = ""
        }: FetchOrganizationsDTO
    ) {
        try {
            limit = Number(limit)
            page = Number(page)
            if (isNaN(limit) || isNaN(page) || limit <= 0 || page <= 0) {
                return this.response.sendError(res, StatusCodes.BadRequest, 'Invalid pagination parameters')
            }

            const offset = (page - 1) * limit

            let centers: Center[]
            let total: number

            if (!status) {
                centers = await this.prisma.center.findMany({
                    where: {
                        OR: [
                            { centerName: { contains: search, mode: 'insensitive' } },
                            ...this.or(search),
                        ]
                    },
                    take: limit,
                    skip: offset,
                    orderBy: sortBy === "name" ? { centerName: 'asc' } : { createdAt: 'desc' }
                })

                total = await this.prisma.center.count()
            } else {
                centers = await this.prisma.center.findMany({
                    where: {
                        status,
                        OR: [
                            { centerName: { contains: search, mode: 'insensitive' } },
                            ...this.or(search),
                        ]
                    },
                    take: limit,
                    skip: offset,
                    orderBy: sortBy === "name" ? { centerName: 'asc' } : { createdAt: 'desc' }
                })

                total = await this.prisma.center.count({ where: { status } })
            }

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: { facilities: centers, total }
            })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error fetching facilities")
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

            await this.prisma.center.update({
                where: { id: centerId },
                data: { status }
            })

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
            status, sortBy, search = ""
        }: FetchPractitionersDTO
    ) {
        try {
            limit = Number(limit)
            page = Number(page)
            if (isNaN(limit) || isNaN(page) || limit <= 0 || page <= 0) {
                return this.response.sendError(res, StatusCodes.BadRequest, 'Invalid pagination parameters')
            }

            const offset = (page - 1) * limit

            const practitioners = await this.prisma.practitioner.findMany({
                where: {
                    role,
                    ...status ? { status } : {},
                    type: 'system',
                    OR: [
                        { fullname: { contains: search, mode: 'insensitive' } },
                        ...this.or(search),
                    ]
                },
                take: limit,
                skip: offset,
                orderBy: sortBy === "name" ? { fullname: 'asc' } : { createdAt: 'desc' }
            })

            const total = await this.prisma.center.count({ where: { ...status ? { status } : {} } })

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
                where: { id: practitionerId, type: 'system' }
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
            await Promise.all(caseStudies.map(async patient => {
                const dicomCounts = await Promise.all(patient.dicoms.map(async dicom => {
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

            const chart: {
                label: string
                count: string
            }[] = []

            if (q === "weekdays") {
                labels = ['MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT', 'SUN']

                for (let i = 0; i < 7; i++) {
                    const count = await this.prisma.patient.count({
                        where: {
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
}
