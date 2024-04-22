import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { titleText } from 'helpers/transformer'
import { EmailDto, LoginDto } from 'src/auth/dto/login.dto'
import { IsEnum, IsString, MaxLength } from 'class-validator'


export class SignupDto extends LoginDto {
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

export class InviteDto extends EmailDto {
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
}