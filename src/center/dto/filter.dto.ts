import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsEnum, IsOptional, IsString } from 'class-validator'

enum Sort {
    date = "date",
    name = "name"
}

export class SortByDTO {
    @ApiProperty({
        enum: Sort
    })
    @IsEnum(Sort)
    @IsOptional()
    sortBy: Sort
}

export class SearchDTO extends SortByDTO {
    @ApiProperty({
        example: ' '
    })
    @IsString()
    @IsOptional()
    @Transform(({ value }) => value.trim())
    search: string
}

export class InfiniteScrollDTO {
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

export class InfiniteScrollWithSearchDTO extends SearchDTO {
    @ApiProperty({
        example: 1
    })
    @IsOptional()
    page: number

    @ApiProperty({
        example: 50
    })
    @IsOptional()
    limit: number
}