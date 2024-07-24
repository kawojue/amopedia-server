import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsOptional } from 'class-validator'
import { InfiniteScrollWithSearchDTO } from './filter.dto'
import { Modality, PatientStatus, Priority, StudyStatus } from '@prisma/client'

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
        enum: Role,
        required: false,
    })
    @IsEnum(Role)
    role: Role
}

export class ChartDTO {
    @ApiProperty({
        enum: Chart,
        required: false,
    })
    @IsEnum(Chart)
    q: Chart
}

export class FetchSPDTO extends InfiniteScrollWithSearchDTO {
    @ApiProperty({
        example: '2024-01-01T00:00:00.000Z',
        default: 0,
        required: false,
    })
    @IsOptional()
    startDate?: string

    @ApiProperty({
        example: '2024-05-02T00:00:00.000Z',
        default: new Date(),
        required: false,
    })
    @IsOptional()
    endDate?: string
}

export class FetchPatientStudyDTO extends FetchSPDTO {
    @ApiProperty({
        enum: StudyStatus,
        required: false,
    })
    @IsOptional()
    @IsEnum(StudyStatus)
    status: StudyStatus

    @ApiProperty({
        enum: Modality,
        required: false,
    })
    @IsOptional()
    @IsEnum(Modality)
    modality: Modality

    @ApiProperty({
        enum: Priority,
        required: false,
    })
    @IsOptional()
    @IsEnum(Priority)
    priority: Priority
}

export class FetchPatientDTO extends FetchSPDTO {
    @ApiProperty({
        enum: PatientStatus,
        required: false,
    })
    @IsOptional()
    @IsEnum(PatientStatus)
    status: PatientStatus
}