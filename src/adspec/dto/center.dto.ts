import { Status } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsOptional } from 'class-validator'
import { SearchDTO } from 'src/center/dto/filter.dto'

export class FetchCentersDTO extends SearchDTO {
    @ApiProperty({
        example: '2024-01-01T00:00:00.000Z',
        default: 0,
        description: 'The starting date. This is optional and could be 0',
        required: false,
    })
    @IsOptional()
    startDate?: string

    @ApiProperty({
        example: '2024-05-02T00:00:00.000Z',
        default: new Date(),
        description: 'The ending date. This is optional and default is current date',
        required: false,
    })
    @IsOptional()
    endDate?: string

    @ApiProperty({
        enum: Status,
        required: false,
    })
    @IsOptional()
    @IsEnum(Status)
    status: Status

    @ApiProperty({
        example: 1,
        required: false,
    })
    @IsOptional()
    page: number

    @ApiProperty({
        example: 100,
        required: false,
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