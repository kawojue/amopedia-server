import { Response } from 'express'
import { JwtService } from '@nestjs/jwt'
import { Injectable } from '@nestjs/common'
import { StatusCodes } from 'enums/StatusCodes'
import { ResponseService } from './response.service'

@Injectable()
export class MiscService {
    private response: ResponseService

    constructor(private readonly jwtService: JwtService) {
        this.response = new ResponseService()
    }

    async generateNewAccessToken({ sub, role, status }: JwtPayload) {
        return await this.jwtService.signAsync({ sub, role, status })
    }

    handleServerError(res: Response, err?: any, msg?: string) {
        console.error(err)
        return this.response.sendError(res, StatusCodes.InternalServerError, msg || 'Something went wrong')
    }

    async validateAndDecodeToken(token: string) {
        try {
            return await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET
            })
        } catch {
            return null
        }
    }
}