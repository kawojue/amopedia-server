import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class DownloadFileDTO {
    @ApiProperty({
        example: '../path/..'
    })
    @IsString()
    @IsNotEmpty()
    path: string
}