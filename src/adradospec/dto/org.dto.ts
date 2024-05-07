import { Status } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsOptional } from 'class-validator'
import { SearchDto } from 'src/center/dto/filter.dto'

export class FetchOrganizationsDTO extends SearchDto {
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

    @ApiProperty({
        enum: Status
    })
    @IsOptional()
    @IsEnum(Status)
    status: Status

    @ApiProperty({
        example: 1
    })
    @IsOptional()
    page: number

    @ApiProperty({
        example: 100
    })
    @IsOptional()
    limit: number
}

export class ToggleStatusDTO {
    @ApiProperty({
        enum: Status
    })
    @IsEnum(Status)
    status: Status
}