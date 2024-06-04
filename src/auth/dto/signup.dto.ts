import {
    MaxLength, IsString, IsOptional,
    Matches, IsEmail, IsPhoneNumber,
} from 'class-validator'
import { PasswordDTO } from './password.dto'
import { Transform } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import { titleText, toLowerCase, toUpperCase } from 'helpers/transformer'

export class OrganizationSignupDTO extends PasswordDTO {
    @ApiProperty({
        example: 'Raheem Kawojue'
    })
    @IsString()
    @MaxLength(100)
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
    email: string

    @ApiProperty({
        example: '+2348131911964'
    })
    @MaxLength(14)
    @IsPhoneNumber()
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
    @Matches(/^\d{5}(?:[-\s]\d{4})?$/, { message: 'Invalid zip code format' })
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
    @IsPhoneNumber()
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