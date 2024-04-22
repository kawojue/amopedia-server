import { Status } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsOptional } from 'class-validator'
import { SearchDto } from 'src/center/dto/filter.dto'

export class FetchOrganizationsDTO extends SearchDto {
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