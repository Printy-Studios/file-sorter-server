
export type File = {
    id: string, //Id should be required
    name?: string,
    // parents: string[]
}

export const fileStr = (file: File) => {
    if (typeof file !== 'object' || Array.isArray(file)) {
        throw new Error('file should be of type object')
    }
    file = file as File
    return JSON.stringify({
        id: file.id,
        name: file.name
    })
}