import { JwtService } from '@nestjs/jwt'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { PrismaService } from 'lib/prisma.service'
import { Injectable, ExecutionContext } from '@nestjs/common'

@Injectable()
export class JwtAuthRoleGuard extends AuthGuard('jwt') {
    constructor(
        private reflector: Reflector,
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {
        super()
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        await super.canActivate(context)

        const roles = this.reflector.get<string[]>('roles', context.getHandler())
        if (!roles) return true

        const ctx = context.switchToHttp()
        const request = ctx.getRequest()

        const token = request.headers.authorization?.split('Bearer ')[1]
        if (!token) return false

        try {
            const decoded = this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET,
                ignoreExpiration: false,
            })

            const { sub: id, status, modelName } = decoded

            const user = await (this.prisma[modelName] as any).findUnique({
                where: { id }
            })

            if (!user || user.status !== status || user.status !== 'ACTIVE') {
                return false
            }

            request.user = decoded
            return roles.includes(decoded.role)
        } catch {
            return false
        }
    }
}
