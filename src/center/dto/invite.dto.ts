import { Transform } from 'class-transformer'
import { Profession } from 'enums/base'
import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString, Matches, MaxLength } from 'class-validator'
import { titleText } from 'helpers/transformer'

export class InviteMedicalStaffDTO {
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

export class InviteCenterAdminDTO {
    @ApiProperty({
        example: 'Raheem Kawojue'
    })
    @IsString()
    @MaxLength(100)
    @Transform(({ value }) => titleText(value))
    fullname: string

    @ApiProperty({
        example: 'kawojue08@gmail.com'
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
}