import { Response } from 'express'
import { Injectable } from '@nestjs/common'
import { MiscService } from 'lib/misc.service'
import { PrismaService } from 'lib/prisma.service'
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
            address, affiliation, email, city, country, state,
            password, practiceNumber, profession, phone, zip_code,
        }: PractitionerSignupDto
    ) {
        try {

        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async organizationSignup(
        res: Response,
        {
            organizationName, fullname, address, state,
            city, country, email, password, phone, zip_code
        }: OrganizationSignupDto
    ) {
        try {

        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }
}
