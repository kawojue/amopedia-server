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

export class ChangePasswordDto extends PasswordDto {
    @ApiProperty({
        example: 'Mypswd123'
    })
    @IsString()
    confirmPassword: string
}