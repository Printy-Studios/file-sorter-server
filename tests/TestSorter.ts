import { File } from '../src/File';
import { ConditionGroup } from '@printy/file-sorter-common/types/Condition';
import Sorter, { SortResponse } from '../src/Sorter';


export type TestFile = File & {
    folder: string
}

export default class TestSorter extends Sorter<TestFile> {

    files: TestFile[] = [];

    async deleteFiles(files: File[] | string[]): Promise<SortResponse> {

        if(!Array.isArray(files)) {
            throw new Error('Files arg must be an array');
        }

        let file_ids: string[];

        if(typeof files[0] !== 'string') {
            const INCORRECT_FILES = this.validateFiles(files as TestFile[]);
            if(INCORRECT_FILES) {
                throw new Error(`File validation failed for files: [${INCORRECT_FILES.join(',')}]`);
            }
            file_ids = this.getFileIDs(files as TestFile[]);
        } else {
            file_ids = files as string[];
        }

        const res: SortResponse = {
            successful: [],
            failed: []
        };

        for(const file_id of file_ids) {
            const FILE_INDEX = this.files.findIndex(file => file.id === file_id);
            if(FILE_INDEX > -1) {
                this.files.splice(FILE_INDEX, 1);
                res.successful.push(file_id);
            } else {
                res.failed.push(file_id);
            }
        }

        return res;
    }

    async getFilesByConditions(conditions: ConditionGroup[]): Promise<TestFile[]> {

        const converted_condition_groups = [];

        const filterFns: ((file: TestFile) => boolean)[] = [];

        for(const condition_group of conditions) {
            converted_condition_groups.push();
            for(const condition of condition_group) {

                let cond: string = condition.condition;

                if(cond === '=') {
                    cond = '==';
                }

                let value: string | number = condition.value;

                

                filterFns.push((file: TestFile) => {
                    const premise_map = {
                        name: 'name',
                        filesize: 'filesize',
                        type: 'type'
                    };
                    const premise = premise_map[condition.premise];
                    if(cond === 'contains' && typeof file[premise] === 'string') {
                        return file[premise].includes(value);
                    }
                    if(typeof value === 'string') {
                        value = `"${value}"`;
                    }
                    return eval(`file.${premise_map[condition.premise]} ${cond} ${value}`);
                });

                // switch(condition.condition) {
                //     case 'contains': {
                //         break;
                //     }
                //     case '!=': {
                //         break;
                //     }
                //     case '=': {
                //         break;
                //     }
                //     case '>': {
                //         break;
                //     }
                //     case '<': {
                //         break;
                //     }
                //     case '>=': {
                //         break;
                //     }
                //     case '<=': {
                //         break;
                //     }
                    
                // }
            }
        }


        let files = [...this.files];

        for(const filterFn of filterFns) {
            files = files.filter(filterFn);
        }

        return files;
    }

    async moveFiles(files: string[] | TestFile[], target_folder_id: string): Promise<SortResponse> {
        const res: SortResponse = {
            successful: [],
            failed: []
        };
        let file_ids: string[] = [];
        if(typeof files[0] === 'string') {
            file_ids = files as string[];
        } else {
            for(const file of files) {
                const file_id = (file as File).id;
                file_ids.push(file_id);
            }
        }

        for(const file_id of file_ids) {
            const index = this.files.findIndex(file => file.id === file_id);
            if(index > -1) {
                this.files[index].folder = target_folder_id;
                res.successful.push(file_id);
            } else {
                res.failed.push(file_id);
            }
            
        }

        return res;
    }

    getFileIDs(files: TestFile[]): string[] {
        const INCORRECT_FILES = this.validateFiles(files);

        if (INCORRECT_FILES) {
            throw new Error(
`Could not get file IDs: validation \
failed for files: [${INCORRECT_FILES.map(file => file.id).join(',')}]`
            );
        }


        const ids: string[] = [];

        for (const FILE of files) {
            ids.push(FILE.id);
        }

        return ids;
    }


    /**
     * Validates whether provided files match the TestFiles schema
     * @param files 
     * @returns Array of incorrect files or null if no incorrect files are found
     */
    validateFiles(files: TestFile[]): TestFile[] | null {
        const res: TestFile[] = [];
        for(const file of files) {
            if(
                !file.id ||
                typeof file.id !== 'string' ||
                !file.folder ||
                typeof file.folder !== 'string'
            ){
                res.push(file);
            }
        }
        return res.length > 0 ? res : null;
    }

    getFilesByIDs(file_ids: string[]) {
        const ERR_MESSAGE = `Passed IDs should be an array of strings`;
        if(!Array.isArray(file_ids)) {
            throw new Error(ERR_MESSAGE);
        }
        if(!file_ids.every(id => typeof id === 'string')) {
            throw new Error(ERR_MESSAGE);
        }
        return this.files.filter(file => file_ids.includes(file.id));
    }
}