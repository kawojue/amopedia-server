import { Response } from 'express'
import { JwtService } from '@nestjs/jwt'
import { Injectable } from '@nestjs/common'
import { StatusCodes } from 'enums/statusCodes'
import { ResponseService } from './response.service'
import { GenerateDicomTokenDTO } from 'src/auth/dto/dicom.dto'

@Injectable()
export class MiscService {
    private response: ResponseService

    constructor(private readonly jwtService: JwtService) {
        this.response = new ResponseService()
    }

    async generateNewAccessToken({ sub, role, status, modelName, centerId }: JwtPayload) {
        return await this.jwtService.signAsync(
            { sub, role, status, modelName, centerId },
            {
                secret: process.env.JWT_SECRET,
                expiresIn: '30d'
            }
        )
    }

    async generateNewDicomToken({ studyId, mrn }: GenerateDicomTokenDTO) {
        return await this.jwtService.signAsync(
            { studyId, mrn },
            {
                secret: process.env.JWT_SECRET,
                expiresIn: '2h'
            }
        )
    }

    handleServerError(res: Response, err?: any, msg?: string) {
        console.error(err)
        this.response.sendError(res, StatusCodes.InternalServerError, msg || err?.message || 'Something went wrong')
    }
}