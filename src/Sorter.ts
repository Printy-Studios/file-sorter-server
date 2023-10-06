import Logger from './Logger'
import { Condition, ConditionGroup } from '@printy/file-sorter-common/types/Condition'
import { SortAction } from '@printy/file-sorter-common/types/SortAction'
import { File } from 'File'


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

    async sort(conditions: ConditionGroup[], action: SortAction) {
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
     * Enable/disable logs
     * @param { boolean } enabled 
     */
    setLogs(enabled: boolean) {
        this.logger.enabled = enabled
    }

    /**
     * Retrieve files according to conditions
     * Must be async
     * @param conditions 
     */
    abstract getFilesByConditions(conditions: ConditionGroup[]): Promise<FileT[]>

    /**
     * Move files to the target folder
     * @param { FileT[] | string[] }    files           Array of files or file ids to move
     * @param { string }                target_folder   Name of target folder
     * 
     * @return { FileT[] } Array of files that were moved
     */
    abstract moveFiles(files: FileT[] | string[], target_folder_id: string): Promise<SortResponse>;

    /**
     * Delete files
     * @param { FileT[] | string[] } files Array of files or file ids to delete
     * 
     * @return true on success, throws error on failure
     */
    abstract deleteFiles(files: FileT[] | string[]): Promise<SortResponse>;

    /**
     * Validate whether provided files match the FileT schema
     */
    abstract validateFiles(files: FileT[]): FileT[];

}