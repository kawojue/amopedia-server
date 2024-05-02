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
import { titleText, toLowerCase, toUpperCase } from 'helpers/transformer'
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
            email = toLowerCase(email)
            fullname = titleText(fullname)
            practiceNumber = toUpperCase(practiceNumber)
            const role = toLowerCase(profession) as Roles

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
                    email, fullname, role, password,
                    practiceNumber, status: 'PENDING',
                    type: 'system', address, affiliation,
                    phone, city, state, country, zip_code,
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
            email = toLowerCase(email)
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
            email = toLowerCase(email)

            const user = await this.prisma.centerAdmin.findUnique({
                where: { email },
                include: { center: true }
            }) || await this.prisma.practitioner.findUnique({
                where: { email },
                include: { center: true }
            })

            if (!user) {
                return this.response.sendError(res, StatusCodes.NotFound, 'Invalid email or password')
            }

            if (user.status === "SUSPENDED") {
                return this.response.sendError(res, StatusCodes.Unauthorized, "Your account has been suspended")
            }

            if (user.status === "PENDING") {
                return this.response.sendError(res, StatusCodes.Unauthorized, 'Your account is pending verification')
            }

            if (user.center) {
                if (user.center.status === "PENDING") {
                    return this.response.sendError(res, StatusCodes.Unauthorized, 'Your organization is pending verification')
                }

                if (user.center.status === "SUSPENDED") {
                    return this.response.sendError(res, StatusCodes.Forbidden, 'Your organization has been suspended')
                }
            }

            const isMatch = await this.encryption.compareAsync(password, user.password)
            if (!isMatch) {
                return this.response.sendError(res, StatusCodes.Unauthorized, "Incorrect password")
            }

            const data: ILogin = {
                id: user.id,
                role: user.role,
                email: user.email,
                status: user.status,
                avatar: user?.avatar,
                fullname: user.fullname,
                centerId: user?.centerId,
                modelName: user.role === 'centerAdmin' ? 'centerAdmin' : 'practitioner',
                route: user.role === 'centerAdmin' ? `/organization/dashboard` : `/dashboard/reports`,
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
            email = toLowerCase(email)

            const user = await this.prisma.centerAdmin.findUnique({
                where: { email },
                include: { center: true }
            }) || await this.prisma.practitioner.findUnique({
                where: { email },
                include: { center: true }
            })

            if (!user) {
                return this.response.sendError(res, StatusCodes.NotFound, 'Invalid email')
            }

            if (user.status === "SUSPENDED") {
                return this.response.sendError(res, StatusCodes.Unauthorized, "Your account has been suspended")
            }

            if (user.status === "PENDING") {
                return this.response.sendError(res, StatusCodes.Unauthorized, 'Your account is pending verification')
            }

            if (user?.center) {
                if (user.center.status === "PENDING") {
                    return this.response.sendError(res, StatusCodes.Unauthorized, 'Your organization is pending verification')
                }

                if (user.center.status === "SUSPENDED") {
                    return this.response.sendError(res, StatusCodes.Forbidden, 'Your organization has been suspended')
                }
            }

            const password = await genPassword()

            await (this.prisma[user.role === "centerAdmin" ? 'centerAdmin' : 'practitioner'] as any).update({
                where: { id: user.id },
                data: {
                    password: await this.encryption.hashAsync(password)
                }
            })

            // TODO: Send the user their new password via email

            this.response.sendSuccess(res, StatusCodes.OK, {
                message: "Your password has been reseted. Please check your email for the new password."
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async changePassword(
        res: Response,
        { sub, modelName }: ExpressUser,
        { currentPassword, newPassword }: ChangePasswordDto
    ) {
        try {
            const user = await this.prisma[modelName].findUnique({
                where: { id: sub }
            })

            const isPasswordCorrect = await this.encryption.compareAsync(currentPassword, user.password)
            if (!isPasswordCorrect) {
                return this.response.sendError(res, StatusCodes.Unauthorized, 'Incorrect password')
            }

            await this.prisma[modelName].update({
                where: { id: sub },
                data: {
                    password: await this.encryption.hashAsync(newPassword)
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
