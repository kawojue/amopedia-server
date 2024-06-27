import { ApiProperty } from '@nestjs/swagger'
import {
    IsEnum, IsNotEmpty, IsOptional, IsString
} from 'class-validator'
import { PartialType } from '@nestjs/mapped-types'
import { Priority, Modality } from '@prisma/client'

enum ReportingStatus {
    Closed = "Closed",
    Open = "Opened"
}

export class PatientStudyDTO {
    @ApiProperty({
        example: 'Oesophagus'
    })
    @IsString()
    @IsNotEmpty()
    body_part: string

    @ApiProperty({
        enum: Priority
    })
    @IsNotEmpty()
    @IsEnum(Priority)
    priority: Priority

    @ApiProperty({
        example: '12345'
    })
    @IsString()
    @IsOptional()
    cpt_code: string

    @ApiProperty({
        enum: Modality
    })
    @IsEnum(Modality)
    @IsNotEmpty()
    modality: Modality

    @ApiProperty({
        example: 'Na to use chisel remove am or drink water'
    })
    @IsString()
    @IsOptional()
    procedure: string

    @ApiProperty({
        example: 'The patient choke while eating cruchy chin chin.'
    })
    @IsString()
    @IsOptional()
    description: string

    @ApiProperty({
        example: "Choken't it?"
    })
    @IsString()
    @IsOptional()
    clinical_info: string

    @ApiProperty({
        example: 'Trachea'
    })
    @IsString()
    @IsOptional()
    site: string

    @ApiProperty({
        example: ''
    })
    @IsString()
    @IsOptional()
    access_code: string

    @ApiProperty({
        enum: ReportingStatus,
        example: 'Closed/Opened'
    })
    @IsEnum(ReportingStatus)
    reporting_status: ReportingStatus

    @ApiProperty({
        type: Array<Express.Multer.File>
    })
    @IsOptional()
    paperworks: Array<Express.Multer.File>
}

export class EditPatientStudyDTO extends PartialType(PatientStudyDTO) { }

enum DesignateStudy {
    Assign = "Assigned",
    Unassign = "Unassigned"
}

export class DesignateStudyDTO {
    @ApiProperty({
        enum: DesignateStudy,
    })
    @IsEnum(DesignateStudy)
    action: DesignateStudy
}