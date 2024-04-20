import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsEmail, IsString, MaxLength } from 'class-validator'

export class EmailDto {
    @ApiProperty({
        example: 'kawojue08@gmail.com'
    })
    @IsEmail({}, { message: "Invalid email address" })
    @Transform(({ value }) => value.toLowerCase().trim())
    email: string
}

export class LoginDto extends EmailDto {
    @ApiProperty({
        example: 'Mypswd123'
    })
    @IsString()
    @MaxLength(36)
    password: string
}