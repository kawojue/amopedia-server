import { ApiProperty } from '@nestjs/swagger'
import { IsEnum } from 'class-validator'


enum StatusAction {
    ACTIVE = "ACTIVE",
    SUSPEND = "SUSPENDED"
}

export class SuspendStaffDto {
    @ApiProperty({
        enum: StatusAction
    })
    @IsEnum(StatusAction)
    action: StatusAction
}