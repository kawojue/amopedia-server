import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength, MinLength } from 'class-validator'

export class PasswordDto {
    @ApiProperty({
        example: 'Mypswd123'
    })
    @IsString()
    @MinLength(6)
    @MaxLength(36, { message: "Password is too long" })
    password: string
}

export class ChangePasswordDto {
    @ApiProperty({
        example: 'Mypswd123'
    })
    @IsString()
    currentPassword: string

    @ApiProperty({
        example: 'Mypswd123'
    })
    @IsString()
    @MinLength(6)
    @MaxLength(36, { message: "Password is too long" })
    newPassword: string
}