import { Roles } from '@prisma/client'
import { Request, Response } from 'express'
import { Injectable } from '@nestjs/common'
import { MiscService } from 'lib/misc.service'
import { StatusCodes } from 'enums/statusCodes'
import { PrismaService } from 'lib/prisma.service'
import { getIpAddress } from 'helpers/getIPAddress'
import { ResponseService } from 'lib/response.service'
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
            email = email.trim().toLowerCase()
            practiceNumber = practiceNumber.toUpperCase()
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
                message: "You will be notified when you're verified by our specialist."
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
                message: "You'll be notified when your organization is verified by our admin"
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }
}
