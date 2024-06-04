import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { toLowerCase } from 'helpers/transformer'
import { IsEmail, IsString, MaxLength } from 'class-validator'

export class EmailDTO {
    @ApiProperty({
        example: 'kawojue08@gmail.com'
    })
    @IsEmail({}, { message: "Invalid email address" })
    @Transform(({ value }) => toLowerCase(value))
    email: string
}

export class LoginDTO extends EmailDTO {
    @ApiProperty({
        example: 'Mypswd123'
    })
    @IsString()
    @MaxLength(36)
    password: string
}