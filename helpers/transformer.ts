export const titleText = (text: string) => {
    return text.trim()
        .split(" ")
        .map(txt => txt[0].toUpperCase() + txt.slice(1).toLowerCase())
        .join(" ")
}

export const toLowerCase = (text: string) => text.toLowerCase().trim()

export const toUpperCase = (text: string) => text.toUpperCase().trim()

export const transformMRN = (patientCount: number) => {
    const maxMRNLength = 7
    const maxPatientCount = Math.pow(10, maxMRNLength) - 1

    if (patientCount > maxPatientCount) {
        throw new Error("Maximum patient count exceeded")
    }

    const paddedMRN = String(patientCount).padStart(maxMRNLength, "0")
    return paddedMRN
}

export const getFileExtension = (file: Express.Multer.File | string): string | undefined => {
    let mimetype: string

    if (typeof file === "object" && file.mimetype) {
        mimetype = file.mimetype
    } else if (typeof file === "string") {
        mimetype = file
    } else {
        throw new Error("Invalid input: file must be either an object with a mimetype or a string.")
    }

    let extension: string | undefined

    switch (mimetype) {
        case 'application/octet-stream':
        case 'application/dicom':
        case 'image/dcm':
            extension = 'dcm'
            break
        case 'video/mp4':
            extension = 'mp4'
            break
        case 'video/webm':
            extension = 'webm'
            break
        case 'video/avi':
            extension = 'avi'
            break
        case 'image/png':
            extension = 'png'
            break
        case 'image/jpeg':
        case 'image/jpg':
            extension = 'jpg'
            break
        case 'audio/mp3':
            extension = 'mp3'
            break
        case 'audio/wav':
            extension = 'wav'
            break
        case 'audio/aac':
            extension = 'aac'
            break
        case 'audio/ogg':
            extension = 'ogg'
            break
        case 'application/pdf':
            extension = 'pdf'
            break
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            extension = 'docx'
            break
        default:
            throw new Error(`Unsupported MIME type: ${mimetype}`)
    }

    return extension
}

export const removeNullFields = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(removeNullFields)
    } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
        return Object.keys(obj).reduce((acc, key) => {
            const value = obj[key]
            if (value !== null) {
                acc[key] = removeNullFields(value)
            }
            return acc
        }, {} as { [key: string]: any })
    } else {
        return obj
    }
}

export const normalizePhoneNumber = (phoneNumber: string): string => {
    let normalized = phoneNumber.replace(/\D/g, '')

    if (normalized.startsWith('0')) {
        normalized = normalized.slice(1)
    }

    if (normalized.startsWith('00')) {
        normalized = normalized.slice(2)
    } else if (normalized.startsWith('+')) {
        normalized = normalized.slice(1)
    }

    return normalized
}