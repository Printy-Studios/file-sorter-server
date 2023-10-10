import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import Sorter, { SortResponse } from '../src/Sorter';
import { File } from '../src/File';
import { ConditionGroup } from '@printy/file-sorter-common/types/Condition';

type TestFile = File & {
    folder: string
}

const DEFAULT_FILES: TestFile[] = [
    {
        id: '1',
        name: 'File 1',
        folder: 'folder1'
    },
    {
        id: '2',
        name: 'File 2',
        folder: 'folder2',
    },
    {
        id: '3',
        name: 'File 3',
        folder: 'folder3',
    },
    {
        id: '4',
        name: 'File 4',
        folder: 'folder4',
    },
    {
        id: '5',
        name: 'File 5',
        folder: 'folder5',
    },
];

class TestSorter extends Sorter<TestFile> {

    files: TestFile[] = [...DEFAULT_FILES];

    async deleteFiles(files: File[] | string[]): Promise<SortResponse> {

        if(!Array.isArray(files)) {
            throw new Error('files arg must be an array');
        }

        let file_ids: string[];

        if(typeof files[0] !== 'string') {
            const INVALID_FILES = this.validateFiles(files as TestFile[]);
            if(INVALID_FILES) {
                throw new Error(`File validation failed for files: [${INVALID_FILES.join(',')}]`);
            }
            file_ids = this.getFileIDS(files as TestFile[]);
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
        return [{
            id: '1',
            folder: '1'
        }];
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

    getFileIDS(files: TestFile[]): string[] {
        const INCORRECT_FILES = this.validateFiles(files);

        if (INCORRECT_FILES) {
            throw new Error(
                `Could not get file IDs: validation \
                failed for files: [${INCORRECT_FILES.join(',')}]`
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

    getFilesByIds(file_ids: string[]) {
        return this.files.filter(file => file_ids.includes(file.id));
    }
}

let testSorter = new TestSorter({ enable_logs: true, log_filters: 'info'});

describe('TestSorter', () => {

    beforeEach(() => {
        testSorter = new TestSorter({enable_logs: true, log_filters: 'info'});
    });

    describe('getFileIDs()', () => {

        const validateFilesSpy = jest.spyOn(testSorter, 'validateFiles');

        it('Should return an array of file ids according to passed files', () => {

            const FILE_IDS: string[] = [
                '123',
                '321',
                'another_id',
                'yet_another_id'
            ];

            const FILES: TestFile[] = FILE_IDS.map(id => ({
                id,
                folder: 'placeholder'
            }));

            const RETURNED_IDS = testSorter.getFileIDS(FILES);

            const WERE_ALL_RETURNED = RETURNED_IDS.every(id => FILE_IDS.includes(id));

            expect(WERE_ALL_RETURNED).toBeTruthy();
        });

        it('Should call validateFiles() method', () => {
            expect(validateFilesSpy).toHaveBeenCalled();
        });

        it('Should throw if validation failed', () => {
            const INCORRECT_FILE = {
                id: [123],
                folder: 123
            };
            // @ts-ignore
            expect(testSorter.getFileIDS([INCORRECT_FILE])).toThrow(
                    `Could not get file IDs: validation failed for files: [123]`
            );
        });
    });

    describe('getFilesByIds()', () => {
        it('Should return an array of files by provided ids', () => {
            const file_ids = ['1', '3', '999'];

            const files = testSorter.getFilesByIds(file_ids);

            expect(Array.isArray(files)).toBeTruthy();

            expect(files.length).toEqual(2);


        });
    });

    describe('validateFiles()', () => {
        it('Should return null if all files are valid', () => {
            const FILES: TestFile[] = [
                {
                    id: '123',
                    folder: 'folder1'
                },
                {
                    id: '321',
                    folder: 'folder2'
                },
                {
                    id: 'hello',
                    folder: 'folder3'
                }
            ];

            const res = testSorter.validateFiles(FILES);

            expect(res).toBeNull();

        });

        it('Should return an error response with an array of invalid files if some files are invalid', () => {
            /*eslint-disable*/
            const ERR_FILES: any[] = [
                {
                    folder: 'folder1'
                },
                {
                    id: 123,
                    folder: 'folder1'
                },
                {
                    id: 'id'
                },
                {
                    id: 'id',
                    folder: 123
                },
                
            ];

            const NO_ERR_FILES: any[] = [
                {
                    id: '321',
                    folder: 'folder2'
                },
                {
                    id: 'hello',
                    folder: 'folder3'
                },
                {
                    id: '321',
                    folder: 'folder2'
                },
                {
                    id: 'hello',
                    folder: 'folder3'
                }
            ];

            const ALL_FILES = [...ERR_FILES, ...NO_ERR_FILES]
            /*eslint-enable*/

            const res = testSorter.validateFiles(ALL_FILES) as TestFile[];

            expect(res.length).toEqual(4);

            for(const file of res) {
                expect(ERR_FILES.includes(file)).toBeTruthy();
            }
        });
    });

    describe('moveFiles()', () => {
        it('Should move files and return successfully moved files', async () => {

            const FILES_TO_MOVE: TestFile[] = [
                {
                    id: '1',
                    folder: 'x'
                },
                {
                    id: '4',
                    folder: 'x'
                }
            ];

            const TARGET_FOLDER = 'target_folder';
            const TARGET_FOLDER_2 = 'target_folder_2';

            const FILES_TO_MOVE_IDS = FILES_TO_MOVE.map(file => file.id);

            await testSorter.moveFiles(FILES_TO_MOVE, TARGET_FOLDER);

            let moved_files = testSorter.getFilesByIds(FILES_TO_MOVE_IDS);

            let were_moved = moved_files.every(file => file.folder === TARGET_FOLDER);

            expect(were_moved).toBeTruthy();

            await testSorter.moveFiles(FILES_TO_MOVE_IDS, TARGET_FOLDER_2);

            moved_files = testSorter.getFilesByIds(FILES_TO_MOVE_IDS);

            were_moved = moved_files.every(file => file.folder === TARGET_FOLDER_2);

            expect(were_moved).toBeTruthy();
        });

        it.todo('Should return failed files and not move them if there are any');
    });

    describe('deleteFiles()', () => {
        it.todo('todo');
    });

    describe('getFilesByConditions()', () => {
        it.todo('todo');
    });

    describe('Logs should not show up if they are disabled', () => {
        it('Should not show logs if they are disabled', () => {
            const log_spy = jest.spyOn(console, 'log');

            testSorter.setLogs(false);

            log_spy.mockClear();
            testSorter.moveFiles(['1', '2', '3'], 'placeholder');

            expect(log_spy).not.toHaveBeenCalled();
        });
    });
});