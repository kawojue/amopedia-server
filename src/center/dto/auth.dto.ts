import { IsEnum } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'


enum StatusAction {
    ACTIVE = "ACTIVE",
    SUSPEND = "SUSPENDED"
}

export class SuspendStaffDTO {
    @ApiProperty({
        enum: StatusAction
    })
    @IsEnum(StatusAction)
    action: StatusAction
}