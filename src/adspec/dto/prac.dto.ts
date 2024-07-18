import { IsEnum } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { FetchCentersDTO } from './org.dto'

enum Role {
    doctor = "doctor",
    radiologist = "radiologist",
}

export class FetchPractitionersDTO extends FetchCentersDTO {
    @ApiProperty({
        enum: Role
    })
    @IsEnum(Role)
    role: Role
}