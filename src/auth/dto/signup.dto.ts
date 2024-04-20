import { Profession } from 'enums/base'
import {
    Matches, IsOptional, IsPhoneNumber,
    IsEmail, MaxLength, IsEnum, IsString,
} from 'class-validator'
import { PasswordDto } from './password.dto'
import { Transform } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import { titleText } from 'helpers/transformer'

export class OrganizationSignupDto extends PasswordDto {
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
    @Transform(({ value }) => titleText(value))
    organizationName: string

    @ApiProperty({
        example: 'johndoe@example.com'
    })
    @IsEmail({
        host_blacklist: ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'fastmail.com']
    }, { message: 'Only business email is required' })
    @Transform(({ value }) => value.toLowerCase().trim())
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

export class PractitionerSignupDto extends PasswordDto {
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
    @Transform(({ value }) => value.toLowerCase().trim())
    email: string

    @ApiProperty({
        example: '+2348131911964'
    })
    @MaxLength(14)
    @IsPhoneNumber()
    phone: string

    @ApiProperty({
        enum: Profession
    })
    @IsEnum(Profession)
    profession: Profession

    @ApiProperty({
        example: 'Lasuth'
    })
    @IsString()
    @Transform(({ value }) => titleText(value))
    affiliation: string

    @ApiProperty({
        example: 'A-12345'
    })
    @IsString()
    @Transform(({ value }) => value.toUpperCase())
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
}