import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength, MinLength } from 'class-validator'

export class PasswordDTO {
    @ApiProperty({
        example: 'Mypswd123'
    })
    @IsString()
    @MinLength(6)
    @MaxLength(36, { message: "Password is too long" })
    password: string
}

export class ChangePasswordDTO {
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