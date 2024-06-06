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
    })
    @IsOptional()
    startDate?: string

    @ApiProperty({
        example: '2024-05-02T00:00:00.000Z',
        default: new Date(),
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

    @ApiProperty({
        enum: Modality
    })
    @IsOptional()
    @IsEnum(Modality)
    modality: Modality

    @ApiProperty({
        enum: Priority
    })
    @IsOptional()
    @IsEnum(Priority)
    priority: Priority
}

export class FetchPatientDTO extends FetchSPDTO {
    @ApiProperty({
        enum: PatientStatus
    })
    @IsOptional()
    @IsEnum(PatientStatus)
    status: PatientStatus
}