import { StatusCodes } from 'enums/statusCodes'

export const validateFile = (
    file: Express.Multer.File,
    maxSize: number, ...mimeTypes: string[]
) => {
    if (maxSize < file.size) {
        return {
            status: StatusCodes.PayloadTooLarge,
            message: `File is too large - ${file.originalname}`
        }
    }

    if (!mimeTypes.includes(file.mimetype)) {
        return {
            status: StatusCodes.UnsupportedMediaType,
            message: `Unsupported file - ${file.originalname}`,
        }
    }

    return { file }
}