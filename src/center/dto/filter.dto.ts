import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString } from 'class-validator'

enum Sort {
    date = "date",
    name = "name"
}

export class SortByDto {
    @ApiProperty({
        enum: Sort
    })
    @IsEnum(Sort)
    @IsOptional()
    sortBy: Sort
}

export class SearchDto extends SortByDto {
    @ApiProperty({
        example: 'Raheem'
    })
    @IsString()
    @IsOptional()
    search: string
}

export class InfiniteScrollDto {
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

export class InfiniteScrollWithSearchDto extends SearchDto {
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