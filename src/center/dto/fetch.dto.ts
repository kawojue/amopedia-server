import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsOptional } from 'class-validator'
import { InfiniteScrollWithSearchDTO } from './filter.dto'
import { PatientStatus, StudyStatus } from '@prisma/client'

enum Role {
    doctor = "doctor",
    radiologist = "radiologist",
    centerAdmin = "centerAdmin",
}

enum Chart {
    montly = "monthly",
    weekdays = "weekdays",
}

export class FetchStaffDTO extends InfiniteScrollWithSearchDTO {
    @ApiProperty({
        enum: Role
    })
    @IsEnum(Role)
    role: Role
}

export class ChartDTO {
    @ApiProperty({
        enum: Chart
    })
    @IsEnum(Chart)
    q: Chart
}

export class FetchSPDTO extends InfiniteScrollWithSearchDTO {
    @ApiProperty({
        example: '2024-01-01T00:00:00.000Z',
        default: 0,
        description: 'The starting date. This is optional and could be 0',
    })
    @IsOptional()
    startDate?: string

    @ApiProperty({
        example: '2024-05-02T00:00:00.000Z',
        default: new Date(),
        description: 'The ending date. This is optional and default is current date'
    })
    @IsOptional()
    endDate?: string
}

export class FetchPatientStudyDTO extends FetchSPDTO {
    @ApiProperty({
        enum: StudyStatus
    })
    @IsOptional()
    @IsEnum(StudyStatus)
    status: StudyStatus
}

export class FetchPatientDTO extends FetchSPDTO {
    @ApiProperty({
        enum: PatientStatus
    })
    @IsOptional()
    @IsEnum(PatientStatus)
    status: PatientStatus
}