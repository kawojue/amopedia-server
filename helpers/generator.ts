import { getFileExtension } from './transformer'

export const genFilename = (file: Express.Multer.File) => {
    const [filename] = file.originalname.split('.')

    return `${filename}_${new Date()
        .toDateString()
        .split(" ")
        .join('-')}_${Math.floor(new Date().getTime() / 1000)}.${getFileExtension(file.mimetype)}`
}

export const genPassword = async () => {
    let password = ''
    let characters = ''

    const startCharCode: number = 'a'.charCodeAt(0)
    const endCharCode: number = 'z'.charCodeAt(0)

    for (let i = startCharCode; i <= endCharCode; i++) {
        characters += String.fromCharCode(i)
    }

    const passwordLength = Math.floor(Math.random() * (12 - 7 + 1)) + 7
    for (let i = 0; i < passwordLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length)
        password += characters[randomIndex]
    }

    return password
}