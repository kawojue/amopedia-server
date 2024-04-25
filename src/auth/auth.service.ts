import { Roles } from '@prisma/client'
import { Request, Response } from 'express'
import { Injectable } from '@nestjs/common'
import { MiscService } from 'lib/misc.service'
import { genPassword } from 'helpers/generator'
import { StatusCodes } from 'enums/statusCodes'
import { PrismaService } from 'lib/prisma.service'
import { getIpAddress } from 'helpers/getIPAddress'
import { EmailDto, LoginDto } from './dto/login.dto'
import { ResponseService } from 'lib/response.service'
import { ChangePasswordDto } from './dto/password.dto'
import { EncryptionService } from 'lib/encryption.service'
import { OrganizationSignupDto, PractitionerSignupDto } from './dto/signup.dto'

@Injectable()
export class AuthService {
    constructor(
        private readonly misc: MiscService,
        private readonly prisma: PrismaService,
        private readonly response: ResponseService,
        private readonly encryption: EncryptionService,
    ) { }

    async practitionerSignup(
        res: Response,
        {
            fullname, address, affiliation, email, country, state,
            city, password, practiceNumber, profession, phone, zip_code,
        }: PractitionerSignupDto
    ) {
        try {
            const role = profession.toLowerCase() as Roles

            const isExists = await this.prisma.practitioner.findFirst({
                where: {
                    OR: [
                        { email: { equals: email, mode: 'insensitive' } },
                        { practiceNumber: { equals: practiceNumber, mode: 'insensitive' } },
                    ]
                }
            })

            if (isExists) {
                return this.response.sendError(res, StatusCodes.Conflict, "Email or practice number already exist.")
            }

            password = await this.encryption.hashAsync(password)

            await this.prisma.practitioner.create({
                data: {
                    address, affiliation, phone,
                    city, state, country, zip_code,
                    email, fullname, role, password,
                    practiceNumber, status: 'PENDING',
                }
            })

            // TODO: mailing

            this.response.sendSuccess(res, StatusCodes.Created, {
                message: "You will be notified when you're verified by our specialists."
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async organizationSignup(
        req: Request,
        res: Response,
        {
            organizationName, fullname, address, state,
            city, country, email, password, phone, zip_code
        }: OrganizationSignupDto
    ) {
        try {
            email = email.trim().toLowerCase()
            password = await this.encryption.hashAsync(password)

            const isExist = await this.prisma.center.findFirst({
                where: {
                    OR: [
                        { email: { equals: email, mode: 'insensitive' } },
                        { centerName: { equals: organizationName, mode: 'insensitive' } }
                    ]
                }
            })

            if (isExist) {
                return this.response.sendError(res, StatusCodes.Conflict, "Organization already exist")
            }

            const center = await this.prisma.center.create({
                data: {
                    address, state, country, zip_code, phone,
                    status: 'PENDING', ip: getIpAddress(req),
                    email, centerName: organizationName, city,
                }
            })

            if (center) {
                await this.prisma.centerAdmin.create({
                    data: {
                        fullname, email, phone,
                        password, superAdmin: true,
                        status: 'PENDING', role: 'centerAdmin',
                        center: { connect: { id: center.id } },
                    }
                })
            }

            // Todo: mailing

            this.response.sendSuccess(res, StatusCodes.Created, {
                message: "You'll be notified when your organization is verified by our Admin"
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async login(
        res: Response,
        { email, password }: LoginDto
    ) {
        try {
            const centerAdmin = await this.prisma.centerAdmin.findUnique({
                where: { email },
                include: { center: true }
            })

            const systemPractitioner = await this.prisma.practitioner.findUnique({
                where: { email },
                include: { assignedPatients: true }
            })

            const centerPractitioner = await this.prisma.centerPractitioner.findUnique({
                where: { email },
                include: { center: true, assignedPatients: true }
            })

            if (!centerAdmin && !systemPractitioner && !centerPractitioner) {
                return this.response.sendError(res, StatusCodes.NotFound, 'Invalid email or password')
            }

            let data = {} as ILogin
            let isPasswordCorrect: boolean = false

            if (centerAdmin || centerPractitioner) {
                const user = centerAdmin || centerPractitioner

                if (user.center.status === "PENDING") {
                    return this.response.sendError(res, StatusCodes.Unauthorized, 'Your organization is pending verification')
                }

                if (user.center.status === "SUSPENDED" || user.status === "SUSPENDED") {
                    return this.response.sendError(res, StatusCodes.Forbidden, 'Your organization or account has been suspended')
                }

                if (centerAdmin) {
                    isPasswordCorrect = await this.encryption.compareAsync(password, centerAdmin.password)

                    data = {
                        id: centerAdmin.id,
                        role: centerAdmin.role,
                        email: centerAdmin.email,
                        modelName: 'centerAdmin',
                        status: centerAdmin.status,
                        avatar: centerAdmin?.avatar,
                        centerId: centerAdmin.centerId,
                        fullname: centerAdmin.fullname,
                        route: `/${centerAdmin.center.id}/dashboard`,
                    }
                }

                if (centerPractitioner) {
                    if (centerPractitioner.assignedPatients.length === 0) {
                        return this.response.sendError(res, StatusCodes.Conflict, "No patients were assigned to you")
                    }

                    isPasswordCorrect = await this.encryption.compareAsync(password, centerPractitioner.password)

                    data = {
                        id: centerPractitioner.id,
                        role: centerPractitioner.role,
                        modelName: 'centerPractitioner',
                        email: centerPractitioner.email,
                        status: centerPractitioner.status,
                        avatar: centerPractitioner?.avatar,
                        centerId: centerPractitioner.centerId,
                        route: `/dashboard/assigned-patients`,
                        fullname: centerPractitioner.fullname,
                    }
                }
            }

            if (systemPractitioner) {
                if (systemPractitioner.assignedPatients.length === 0) {
                    return this.response.sendError(res, StatusCodes.Conflict, "No patients were assigned to you")
                }

                isPasswordCorrect = await this.encryption.compareAsync(password, systemPractitioner.password)

                data = {
                    id: systemPractitioner.id,
                    modelName: 'practitioner',
                    role: systemPractitioner.role,
                    email: systemPractitioner.email,
                    avatar: systemPractitioner?.avatar,
                    status: systemPractitioner.status,
                    route: `/dashboard/assigned-patients`,
                    fullname: systemPractitioner.fullname,
                }
            }

            if (!isPasswordCorrect) {
                return this.response.sendError(res, StatusCodes.Unauthorized, "Incorrect password")
            }

            const access_token = await this.misc.generateNewAccessToken({
                sub: data.id,
                role: data.role,
                status: data.status,
                centerId: data.centerId,
                modelName: data.modelName,
            })

            this.response.sendSuccess(res, StatusCodes.OK, {
                data,
                access_token,
                message: "Login successful"
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async resetPassword(
        res: Response,
        { email }: EmailDto
    ) {
        try {
            const centerAdmin = await this.prisma.centerAdmin.findUnique({
                where: { email },
                include: { center: true }
            })

            const systemPractitioner = await this.prisma.practitioner.findUnique({
                where: { email },
                include: { assignedPatients: true }
            })

            const centerPractitioner = await this.prisma.centerPractitioner.findUnique({
                where: { email },
                include: { center: true, assignedPatients: true }
            })

            if (!centerAdmin && !systemPractitioner && !centerPractitioner) {
                return this.response.sendError(res, StatusCodes.NotFound, 'There is no account associated with this email')
            }

            let data = {} as ILogin

            if (centerAdmin || centerPractitioner) {
                const user = centerAdmin || centerPractitioner

                if (user.center.status === "PENDING") {
                    return this.response.sendError(res, StatusCodes.Unauthorized, 'Your organization is pending verification')
                }

                if (user.center.status === "SUSPENDED" || user.status === "SUSPENDED") {
                    return this.response.sendError(res, StatusCodes.Forbidden, 'Your organization or account has been suspended')
                }

                if (centerAdmin) {
                    data = {
                        id: centerAdmin.id,
                        role: centerAdmin.role,
                        modelName: 'centerAdmin',
                        email: centerAdmin.email,
                        fullname: centerAdmin.fullname,
                    }
                }

                if (centerPractitioner) {
                    if (centerPractitioner.assignedPatients.length === 0) {
                        return this.response.sendError(res, StatusCodes.Conflict, "No patients were assigned to you")
                    }

                    data = {
                        id: centerPractitioner.id,
                        role: centerPractitioner.role,
                        email: centerPractitioner.email,
                        modelName: 'centerPractitioner',
                        fullname: centerPractitioner.fullname,
                    }
                }
            }

            if (systemPractitioner) {
                if (systemPractitioner.assignedPatients.length === 0) {
                    return this.response.sendError(res, StatusCodes.Conflict, "No patients were assigned to you")
                }

                data = {
                    id: systemPractitioner.id,
                    modelName: 'practitioner',
                    role: systemPractitioner.role,
                    email: systemPractitioner.email,
                    fullname: systemPractitioner.fullname,
                }
            }

            const password = await genPassword()

            await this.prisma[data.modelName].update({
                where: { id: data.id },
                data: {
                    password: await this.encryption.hashAsync(password)
                }
            })

            // TODO: Send the user their new password via email

            this.response.sendSuccess(res, StatusCodes.OK, {
                message: "Your password has been reset. Please check your email for the new password."
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async changePassword(
        res: Response,
        { sub, modelName }: ExpressUser,
        { password, confirmPassword }: ChangePasswordDto
    ) {
        try {
            if (password !== confirmPassword) {
                return this.response.sendError(res, StatusCodes.BadRequest, "Passwords do not match")
            }

            const hashedPassword = await this.encryption.hashAsync(password)

            await this.prisma[modelName].update({
                where: { id: sub },
                data: {
                    password: hashedPassword
                }
            })

            this.response.sendSuccess(res, StatusCodes.OK, {
                message: "Your password has been updated"
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }
}
