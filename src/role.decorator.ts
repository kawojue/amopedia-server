import { Roles } from '@prisma/client'
import { SetMetadata } from '@nestjs/common'

export const Role = (...roles: Roles[]) => SetMetadata('roles', roles)