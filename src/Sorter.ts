
export type SortCondition = {
    premise: 'name' | 'filesize' | 'type',
    condition: '=' | '<' | '>' | 'contains',
    value: string|number
}

export type SortConditionGroup = SortCondition[]

export type MoveAction = {
    type: 'move',
    to: string
}

export type DeleteAction = {
    type: 'delete'
}

export type CreateAction = {
    type: 'create',
    filename: string,
    filetype: 'folder' | 'file',
    location: string
}

export type SortAction = MoveAction | DeleteAction | CreateAction

export type File = {
    id: string,
    name: string,
    parents: string[]
}

export default abstract class Sorter<FileT> {


    async sort(conditions: SortConditionGroup[], action: MoveAction) {
        const files = await this.getFilesByConditions(conditions);

        const file_ids = files.map((file) => file.id);


        console.log(file_ids)

        let res = null;

        if(action.type === 'move') {
            res = await this.moveFiles(file_ids, action.to);
        } else {
            throw new Error("Only 'move' action type currently supported");
        }

        return res;
    }

    /**
     * Retrieve files according to conditions
     * Must be async
     * @param conditions 
     */
    abstract getFilesByConditions(conditions: SortConditionGroup[]): Promise<File[]>

    /**
     * Move files with associated ids to the target folder
     * @param { string[] }  files        Array of files or file ids to move
     * @param { string }    target_folder   Name of target folder
     */
    abstract moveFiles(files: FileT[] | string[], target_folder: string);
}