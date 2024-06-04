import { ApiProperty } from '@nestjs/swagger'
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
        example: 'Raheem'
    })
    @IsString()
    @IsOptional()
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