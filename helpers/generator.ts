export const genFilename = (orginalname: string) => {
    const [filename, extension] = orginalname.split('.')

    return `${filename}_${new Date().toDateString().split(" ").join('-')}.${extension}`
}