
export type File = {
    id?: string,
    name?: string,
    // parents: string[]
}

export const fileStr = (file: File) => {
    return JSON.stringify({
        id: file.id,
        name: file.name
    })
}