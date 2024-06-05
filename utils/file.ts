import { StatusCodes } from 'enums/statusCodes'
import { getFileExtension } from 'helpers/transformer'

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

    if (!extensions.includes(getFileExtension(file))) {
        return {
            status: StatusCodes.UnsupportedContent,
            message: `Extension is not allowed - ${file.originalname}`,
        }
    }

    return { file }
}