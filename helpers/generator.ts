export const genFilename = (orginalname: string) => {
    const [filename, extension] = orginalname.split('.')

    return `
    ${filename}_${new Date()
            .toDateString()
            .split(" ")
            .join('-')}.${extension}
    `
}

export const genPassword = () => {
    let password = ''
    let characters = ''

    const startCharCode: number = 'a'.charCodeAt(0)
    const endCharCode: number = 'z'.charCodeAt(0)

    for (let i = startCharCode; i <= endCharCode; i++) {
        characters += String.fromCharCode(i)
    }

    const passwordLength = Math.floor(Math.random() * (17 - 8 + 1)) + 8
    for (let i = 0; i < passwordLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length)
        password += characters[randomIndex]
    }

    return password
}