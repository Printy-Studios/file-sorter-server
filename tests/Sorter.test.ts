import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import TestSorter, { TestFile } from './TestSorter';
import { ConditionGroup } from '@printy/file-sorter-common/types/Condition';
import { SortAction } from '@printy/file-sorter-common/types/SortAction';

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



//#TODO: Remove this testSorter variable and use the prepare() function in tests instead
let testSorter = new TestSorter({ enable_logs: true, log_filters: 'info'});

// const prepare = () => {
//     return {
//         testSorter: new TestSorter({enable_logs: true, log_filters: 'info'})
//     };
// };

beforeEach(() => {
    testSorter = new TestSorter({enable_logs: true, log_filters: 'info'});
    testSorter.files = [...DEFAULT_FILES];
});

describe('TestSorter', () => {

    

    const validateFilesSpy = jest.spyOn(TestSorter.prototype, 'validateFiles');

    describe('getFileIDs()', () => {

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

            const RETURNED_IDS = testSorter.getFileIDs(FILES);

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
            expect(() => testSorter.getFileIDs([INCORRECT_FILE])).toThrow(
                `Could not get file IDs: validation failed for files: [123]`
            );
        });
    });

    describe('getFilesByIds()', () => {
        it('Should return an array of files by provided ids', () => {
            const file_ids = ['1', '3', '999'];

            const files = testSorter.getFilesByIDs(file_ids);

            expect(Array.isArray(files)).toBeTruthy();

            expect(files.length).toEqual(2);


        });

        it('Should throw if provided IDs is not an array of strings', () => {

            /*eslint-disable*/
            let INCORRECT_IDS: any = [123, {}, '123'];
            /*eslint-enable*/

            const ERR_MESSAGE = `Passed IDs should be an array of strings`;

            expect(() => testSorter.getFilesByIDs(INCORRECT_IDS)).toThrow(
                ERR_MESSAGE
            );

            INCORRECT_IDS = 123;

            expect(() => testSorter.getFilesByIDs(INCORRECT_IDS)).toThrow(
                ERR_MESSAGE
            );
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

            let moved_files = testSorter.getFilesByIDs(FILES_TO_MOVE_IDS);

            let were_moved = moved_files.every(file => file.folder === TARGET_FOLDER);

            expect(were_moved).toBeTruthy();

            await testSorter.moveFiles(FILES_TO_MOVE_IDS, TARGET_FOLDER_2);

            moved_files = testSorter.getFilesByIDs(FILES_TO_MOVE_IDS);

            were_moved = moved_files.every(file => file.folder === TARGET_FOLDER_2);

            expect(were_moved).toBeTruthy();
        });

        it.todo('Should return failed files and not move them if there are any');
    });

    describe('deleteFiles()', () => {

        beforeEach(() => {
            testSorter = new TestSorter({enable_logs: true, log_filters: 'info'});
        });

        validateFilesSpy.mockClear();
        
        it('Should remove specified files by array of IDs and return IDS of those files', async () => {

            //const { testSorter: _testSorter } = prepare();
            
            const FILE_IDS = ['1', '2', '4'];

            //First check if files to delete are currently in the testSorter's files list
            let are_files_present = FILE_IDS.every(file_id => testSorter.files.findIndex(file => file.id === file_id) > -1);//testSorter.files.every(file => FILE_IDS.includes(file.id));
            expect(are_files_present).toBeTruthy();

            const res = await testSorter.deleteFiles(FILE_IDS);

            are_files_present = FILE_IDS.every(file_id => testSorter.files.findIndex(file => file.id === file_id) > -1);
            expect(are_files_present).toBeFalsy();

            expect(res.successful.length).toBe(3);
            expect(res.failed.length).toBe(0);
        });

        it('Should remove specified files by array of File type', async () => {

            const FILES: TestFile[] = [
                {
                    id: '1',
                    folder: 'placeholder'
                }, 
                {
                    id: '2',
                    folder: 'placeholder'
                },
                {
                    id: '4',
                    folder: 'placeholder'
                }
            ];

            const FILE_IDS = FILES.map(file => file.id);
            //First check if files to delete are currently in the testSorter's files list
            let are_files_present = FILE_IDS.every(file_id => testSorter.files.findIndex(file => file.id === file_id) > -1);
            expect(are_files_present).toBeTruthy();

            const res = await testSorter.deleteFiles(FILES);

            are_files_present = FILE_IDS.every(file_id => testSorter.files.findIndex(file => file.id === file_id) > -1);
            expect(are_files_present).toBeFalsy();

            expect(res.successful.length).toBe(3);
            expect(res.failed.length).toBe(0);
        });

        it(`Should return file IDs in 'failed' property if the file deletion failed`, async () => {
            const FILE_IDS = ['99', '100'];

            const res = await testSorter.deleteFiles(FILE_IDS);

            const ARE_IDS_IN_RESPONSE = res.failed.every(id => FILE_IDS.includes(id));
            
            expect(ARE_IDS_IN_RESPONSE).toBeTruthy();
            expect(res.failed.length).toBe(2);
            expect(res.successful.length).toBe(0);
        });

        it('Should run the validateFiles() method', () => {
            expect(validateFilesSpy).toHaveBeenCalled();
        });

        it('Should throw error if file validation failed or if argument is not an array', () => {

            const INCORRECT_FILES = [
                {
                    id: 123,
                    folder: 'aaa'
                },{
                    folder: 123
                }
            ];

            //@ts-ignore
            expect(() => testSorter.deleteFiles(INCORRECT_FILES)).rejects.toThrow();

            const INCORRECT_IDS = [123, {}];

            //@ts-ignore
            expect(() => testSorter.deleteFiles(INCORRECT_IDS)).rejects.toThrow();

            const NOT_ARRAY = 123;

            //@ts-ignore
            expect(() => testSorter.deleteFiles(NOT_ARRAY)).rejects.toThrow('Files arg must be an array');



        });
    });

    describe('getFilesByConditions()', () => {
        it('Should return files according to conditions #1', async () => {
            
            const VALUE = 'File';

            const CONDITIONS_1:ConditionGroup[] = [
                [
                    {
                        premise: 'name',
                        condition: 'contains',
                        value: VALUE
                    }
                ]
            ];

            const FILES: TestFile[] = await testSorter.getFilesByConditions(CONDITIONS_1);

            const ACTUAL_FILES = testSorter.files.filter(file => file.name?.includes(VALUE));

            const IS_MATCH = FILES.every(FILE => ACTUAL_FILES.some(ACTUAL_FILE => ACTUAL_FILE === FILE));

            expect(IS_MATCH).toBeTruthy();
            
        });

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

describe('Sorter', () => {
    describe('sort()', () => {
        it('Should move correctly', async () => {

            const VALUE = 'File';

            const CONDITIONS: ConditionGroup[] = [
                [
                    {
                        premise: 'name',
                        condition: 'contains',
                        value: VALUE   
                    }
                ]
                
            ];

            const FOLDER_NAME = 'new_folder';

            const ACTION: SortAction = {
                type: 'move',
                to: FOLDER_NAME
            };

            await testSorter.sort(CONDITIONS, ACTION);

            const FILES: TestFile[] = await testSorter.getFilesByConditions(CONDITIONS);

            const WERE_FILES_MOVED = FILES.every(FILE => FILE.folder === FOLDER_NAME);

            expect(WERE_FILES_MOVED).toBeTruthy();
        });

        it('Should delete correctly', async () => {
            const VALUE = 'File';

            const CONDITIONS: ConditionGroup[] = [
                [
                    {
                        premise: 'name',
                        condition: 'contains',
                        value: VALUE   
                    }
                ]
                
            ];

            const ACTION: SortAction = {
                type: 'delete'
            };

            await testSorter.sort(CONDITIONS, ACTION);

            const FILES: TestFile[] = await testSorter.getFilesByConditions(CONDITIONS);

            const WERE_FILES_DELETED = FILES.length === 0;

            expect(WERE_FILES_DELETED).toBeTruthy();
        });
    });
});