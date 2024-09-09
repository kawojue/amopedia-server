import { ApiProperty } from "@nestjs/swagger"
import { Transform } from "class-transformer"
import { toUpperCase } from "helpers/transformer"
import { IsJWT, IsNotEmpty, IsString } from "class-validator"

export class GenerateDicomTokenDTO {
    @ApiProperty({
        example: '0001'
    })
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => toUpperCase(value))
    mrn: string

    @ApiProperty({
        example: 'NGTDGST'
    })
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => toUpperCase(value))
    studyId: string
}

export class DicomTokenDTO {
    @ApiProperty({
        example: 'eyj.'
    })
    @IsJWT()
    @IsString()
    @IsNotEmpty()
    token: string
}