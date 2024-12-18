import {
    IsEmail,
    IsString,
    MaxLength,
    IsOptional,
} from 'class-validator'
import {
    titleText,
    toLowerCase,
    toUpperCase,
    normalizePhoneNumber,
} from 'helpers/transformer'
import { PasswordDTO } from './password.dto'
import { Transform } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'

export class OrganizationSignupDTO extends PasswordDTO {
    @ApiProperty({
        example: 'Raheem Kawojue'
    })
    @IsString()
    @MaxLength(100)
    @Transform(({ value }) => titleText(value))
    fullname: string

    @ApiProperty({
        example: 'Maternity Clinic'
    })
    @IsString()
    @MaxLength(100)
    organizationName: string

    @ApiProperty({
        example: 'johndoe@example.com'
    })
    @IsEmail({
        host_blacklist: ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'fastmail.com']
    }, { message: 'Only business email is required' })
    @Transform(({ value }) => toLowerCase(value))
    email: string

    @ApiProperty({
        example: '+2348131911964'
    })
    @MaxLength(14)
    @Transform(({ value }) => normalizePhoneNumber(value))
    phone: string

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
    zip_code: string

    @ApiProperty({
        example: 'Nigeria'
    })
    @IsString()
    @MaxLength(50)
    @Transform(({ value }) => titleText(value))
    country: string
}

export class PractitionerSignupDTO extends PasswordDTO {
    @ApiProperty({
        example: 'Raheem Kawojue'
    })
    @IsString()
    @MaxLength(100)
    @Transform(({ value }) => titleText(value))
    fullname: string

    @ApiProperty({
        example: 'johndoe@example.com'
    })
    @IsEmail({}, { message: 'Invalid email address' })
    @Transform(({ value }) => toLowerCase(value))
    email: string

    @ApiProperty({
        example: '+2348131911964'
    })
    @MaxLength(14)
    @Transform(({ value }) => normalizePhoneNumber(value))
    phone: string

    @ApiProperty({
        example: 'Lasuth'
    })
    @IsString()
    affiliation: string

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
    zip_code: string

    @ApiProperty({
        example: 'Nigeria'
    })
    @IsString()
    @MaxLength(50)
    @Transform(({ value }) => titleText(value))
    country: string
}