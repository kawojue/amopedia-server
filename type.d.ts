type Status = 'ACTIVE' | 'PENDING' | 'SUSPENDED'
type Role = 'admin' | 'centerAdmin' | 'radiologist' | 'doctor' | 'specialist'

interface ExpressUser extends Express.User {
    role: Role
    sub: string
    status: Status
    modelName?: string
}

interface IRequest extends Request {
    user: ExpressUser
}

interface JwtPayload {
    role: Role
    sub: string
    status: Status
    modelName?: string
}

interface IFile {
    url: string
    path: string
    type: string
}

interface ILogin {
    id: string
    role: Role
    route?: string
    avatar?: IFile
    status?: Status
    email?: string
    fullname: string
    modelName?: string
}