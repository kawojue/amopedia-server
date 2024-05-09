import { ApiProperty } from '@nestjs/swagger'
import {
    IsEnum, IsNotEmpty, IsOptional, IsString
} from 'class-validator'

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
        example: 'Extreme/Medium'
    })
    @IsString()
    @IsNotEmpty()
    priority: string

    @ApiProperty({
        example: '12345'
    })
    @IsString()
    @IsOptional()
    cpt_code: string

    @ApiProperty({
        example: 'CT'
    })
    @IsString()
    @IsNotEmpty()
    modality: string

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
    attachments: Array<Express.Multer.File>
}