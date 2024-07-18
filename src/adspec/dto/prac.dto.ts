import { IsEnum } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { FetchOrganizationsDTO } from './org.dto'

enum Role {
    doctor = "doctor",
    radiologist = "radiologist",
}

export class FetchPractitionersDTO extends FetchOrganizationsDTO {
    @ApiProperty({
        enum: Role
    })
    @IsEnum(Role)
    role: Role
}