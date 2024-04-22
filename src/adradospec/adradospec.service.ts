import { Response } from 'express'
import { Injectable } from '@nestjs/common'
import { MiscService } from 'lib/misc.service'
import { genPassword } from 'helpers/generator'
import { StatusCodes } from 'enums/statusCodes'
import { LoginDto } from 'src/auth/dto/login.dto'
import { PrismaService } from 'lib/prisma.service'
import { InviteDto, SignupDto } from './dto/auth.dto'
import { Center, Practitioner } from '@prisma/client'
import { ResponseService } from 'lib/response.service'
import { FetchPractitionersDTO } from './dto/prac.dto'
import { EncryptionService } from 'lib/encryption.service'
import { FetchOrganizationsDTO, ToggleStatusDTO } from './dto/org.dto'

@Injectable()
export class AdradospecService {
    constructor(
        private readonly misc: MiscService,
        private readonly prisma: PrismaService,
        private readonly response: ResponseService,
        private readonly encryption: EncryptionService,
    ) { }

    async signup(res: Response, { email, password, fullname }: SignupDto) {
        try {
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
                where: { email }
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
                data: {
                    fullname: adradospec.fullname,
                },
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
            const adradospec = await this.prisma.adradospec.findUnique({
                where: { id: sub }
            })

            if ((authRole !== "admin" && !adradospec.superAdmin) && role === "admin") {
                return this.response.sendError(res, StatusCodes.Forbidden, "Only the Super Admin can invite an Admin")
            }

            const password = await this.encryption.hashAsync(await genPassword(), 12)

            const newAdradospec = await this.prisma.adradospec.create({
                data: {
                    role,
                    email,
                    password,
                    fullname,
                    superAdmin: false
                }
            })

            if (newAdradospec) {
                // Todo: mail new password
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
                            { country: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } },
                            { city: { contains: search, mode: 'insensitive' } },
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
                            { country: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } },
                            { state: { contains: search, mode: 'insensitive' } },
                            { city: { contains: search, mode: 'insensitive' } },
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
        orgId: string,
        { status }: ToggleStatusDTO
    ) {
        try {
            const center = await this.prisma.center.findUnique({
                where: { id: orgId }
            })

            if (!center) {
                return this.response.sendError(res, StatusCodes.NotFound, 'Facility not found')
            }

            await this.prisma.center.update({
                where: { id: orgId },
                data: { status }
            })

            // TODO: mail about status change

            this.response.sendSuccess(res, StatusCodes.OK, {
                message: `The center is now ${center.status}`
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

            let practioners: Practitioner[]
            let total: number

            if (!status) {
                practioners = await this.prisma.practitioner.findMany({
                    where: {
                        role,
                        OR: [
                            { fullname: { contains: search, mode: 'insensitive' } },
                            { country: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } },
                            { city: { contains: search, mode: 'insensitive' } },
                        ]
                    },
                    take: limit,
                    skip: offset,
                    orderBy: sortBy === "name" ? { fullname: 'asc' } : { createdAt: 'desc' }
                })

                total = await this.prisma.center.count()
            } else {
                practioners = await this.prisma.practitioner.findMany({
                    where: {
                        role,
                        status,
                        OR: [
                            { fullname: { contains: search, mode: 'insensitive' } },
                            { country: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } },
                            { state: { contains: search, mode: 'insensitive' } },
                            { city: { contains: search, mode: 'insensitive' } },
                        ]
                    },
                    take: limit,
                    skip: offset,
                    orderBy: sortBy === "name" ? { fullname: 'asc' } : { createdAt: 'desc' }
                })

                total = await this.prisma.center.count({ where: { status } })
            }

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: { practioners, total }
            })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error fetching practitioners")
        }
    }

    async fetchPractitioner(res: Response, practitionerId: string) {
        try {
            const practitioner = await this.prisma.practitioner.findUnique({
                where: { id: practitionerId }
            })

            if (!practitioner) {
                return this.response.sendError(res, StatusCodes.NotFound, 'Practitioner not found')
            }

            const totalAssignedPatients = await this.prisma.patient.count({ where: { practitionerId } })

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: { practitioner, totalAssignedPatients }
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
}
