import { StatusCodes } from 'enums/statusCodes'

export const validateFile = (
    file: Express.Multer.File,
    maxSize: number, ...extensions: string[]
) => {
    if (maxSize < file.size) {
        return {
            status: StatusCodes.PayloadTooLarge,
            message: `File is too large - ${file.originalname}`
        }
    }

    if (!extensions.includes(file.originalname.split('.').pop())) {
        return {
            status: StatusCodes.UnsupportedContent,
            message: `Extension is not allowed - ${file.originalname}`,
        }
    }

    return { file }
}