import Logger from './Logger'

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

export type SortAction = MoveAction | DeleteAction

export type File = {
    id?: string,
    name?: string,
    // parents: string[]
}

export type SortResponse = {
    successful: string[],
    failed: string[]
}

const SUPPORTED_ACTIONS = ['move', 'delete']

export default abstract class Sorter<FileT extends File> {

    logger;

    constructor( { enable_logs, log_filters} ) {
        this.logger = new Logger(enable_logs, 'Sorter')
        this.logger.filter = log_filters
    }

    async sort(conditions: SortConditionGroup[], action: MoveAction) {
        this.logger.log(['Retrieving files by conditions: ', conditions]);
        const files = await this.getFilesByConditions(conditions);

        //const file_ids = files.map((file) => file.id);

        this.logger.log(['Retrieved files: ', files.map(file => file.id)])

        let res = null;

        

        if(!SUPPORTED_ACTIONS.includes(action.type)) {
            throw new Error(`Only ${SUPPORTED_ACTIONS.join(', ')} action types currently supported`);
        }
        if (action.type === 'move') {
            res = await this.moveFiles(files, action.to);
        } else if (action.type === 'delete') {
            res = await this.deleteFiles(files)
        }

        return res;
    }

    /**
     * Retrieve files according to conditions
     * Must be async
     * @param conditions 
     */
    abstract getFilesByConditions(conditions: SortConditionGroup[]): Promise<FileT[]>

    /**
     * Move files to the target folder
     * @param { FileT[] | string[] }    files           Array of files or file ids to move
     * @param { string }                target_folder   Name of target folder
     * 
     * @return { FileT[] } Array of files that were moved
     */
    abstract moveFiles(files: FileT[] | string[], target_folder: string): Promise<SortResponse>;

    /**
     * Delete files
     * @param { FileT[] | string[] } files Array of files or file ids to delete
     * 
     * @return true on success, throws error on failure
     */
    abstract deleteFiles(files: FileT[] | string[]): Promise<SortResponse>;
}