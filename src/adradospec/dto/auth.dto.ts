import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { titleText } from 'helpers/transformer'
import { EmailDTO, LoginDTO } from 'src/auth/dto/login.dto'
import { IsEnum, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'


export class SignupDTO extends LoginDTO {
    @ApiProperty({
        example: 'Raheem Kawojue',
    })
    @IsString()
    @MaxLength(100)
    @Transform(({ value }) => titleText(value))
    fullname: string
}

enum Role {
    admin = "admin",
    specialist = "specialist"
}

export class InviteDTO extends EmailDTO {
    @ApiProperty({
        example: 'Raheem Kawojue',
    })
    @IsString()
    @MaxLength(100)
    @Transform(({ value }) => titleText(value))
    fullname: string

    @ApiProperty({
        enum: Role
    })
    @IsEnum(Role)
    role: Role

    @ApiProperty({
        example: 'Mypswd123'
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    @MaxLength(32)
    password: string
}