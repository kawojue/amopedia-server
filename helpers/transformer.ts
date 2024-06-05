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