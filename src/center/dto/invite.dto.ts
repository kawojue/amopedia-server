import {
    IsEnum,
    Matches,
    IsString,
    MaxLength,
    MinLength,
    IsNotEmpty,
    IsOptional,
} from 'class-validator'
import {
    titleText,
    toUpperCase,
    normalizePhoneNumber,
} from 'helpers/transformer'
import { Profession } from 'enums/base'
import { Transform } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import { EmailDTO } from 'src/auth/dto/login.dto'

export class InviteMedicalStaffDTO extends EmailDTO {
    @ApiProperty({
        example: 'Raheem Kawojue'
    })
    @IsString()
    @MaxLength(100)
    @Transform(({ value }) => titleText(value))
    fullname: string

    @ApiProperty({
        example: '+2348131911964'
    })
    @MaxLength(14)
    phone: string

    @ApiProperty({
        enum: Profession
    })
    @IsEnum(Profession)
    profession: Profession

    @ApiProperty({
        example: 'A-12345'
    })
    @IsString()
    @Transform(({ value }) => toUpperCase(value))
    practiceNumber: string

    @ApiProperty({
        example: 'My address'
    })
    @IsString()
    @MaxLength(100)
    address: string

    @ApiProperty({
        example: 'My city'
    })
    @IsString()
    @MaxLength(50)
    @Transform(({ value }) => titleText(value))
    city: string

    @ApiProperty({
        example: 'My state'
    })
    @IsString()
    @MaxLength(50)
    @Transform(({ value }) => titleText(value))
    state: string

    @ApiProperty({
        example: '106101'
    })
    @IsOptional()
    @Matches(/^\d{5}(?:[-\s]\d{4})?$/, { message: 'Invalid zip code format' })
    zip_code: string

    @ApiProperty({
        example: 'Nigeria'
    })
    @IsString()
    @MaxLength(50)
    @Transform(({ value }) => titleText(value))
    country: string

    @ApiProperty({
        example: 'Mypswd123'
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    @MaxLength(32)
    password: string
}

export class InviteCenterAdminDTO extends EmailDTO {
    @ApiProperty({
        example: 'Raheem Kawojue'
    })
    @IsString()
    @MaxLength(100)
    @Transform(({ value }) => titleText(value))
    fullname: string

    @ApiProperty({
        example: '+2348131911964'
    })
    @MaxLength(14)
    @Transform(({ value }) => normalizePhoneNumber(value))
    phone: string

    @ApiProperty({
        example: 'Mypswd123'
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    @MaxLength(32)
    password: string
}