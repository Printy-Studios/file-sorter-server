import { describe, it, expect, beforeEach, jest } from '@jest/globals'

import Sorter, { SortResponse } from '../src/Sorter'
import { File } from '../src/File'
import { ConditionGroup } from '@printy/file-sorter-common/types/Condition'

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
]

class TestSorter extends Sorter<TestFile> {

    files: TestFile[] = DEFAULT_FILES

    async deleteFiles(files: File[] | string[]): Promise<SortResponse> {
        return {
            successful: [],
            failed: []
        }
    }

    async getFilesByConditions(conditions: ConditionGroup[]): Promise<TestFile[]> {
        return [{
            id: '1',
            folder: '1'
        }]
    }

    async moveFiles(files: string[] | TestFile[], target_folder_id: string): Promise<SortResponse> {
        const res: SortResponse = {
            successful: [],
            failed: []
        }
        let file_ids: string[] = []
        if(typeof files[0] === 'string') {
            file_ids = files as string[]
        } else {
            for(const file of files) {
                const file_id = (file as File).id
                file_ids.push(file_id)
            }
        }

        for(const file_id of file_ids) {
            const index = this.files.findIndex(file => file.id === file_id)
            if(index > -1) {
                this.files[index].folder = target_folder_id
                res.successful.push(file_id)
            } else {
                res.failed.push(file_id)
            }
            
        }

        return res
    }

    validateFiles(files: TestFile[]): TestFile[] {
        const res: TestFile[] = []
        for(const file of files) {
            if(!file.id){
                res.push(file)
            }
        }
        return res;
    }

    getFilesByIds(file_ids: string[]) {
        return this.files.filter(file => file_ids.includes(file.id))
    }
}

let testSorter = new TestSorter({ enable_logs: true, log_filters: 'info'})

describe('TestSorter', () => {

    beforeEach(() => {
        testSorter = new TestSorter({enable_logs: true, log_filters: 'info'})
    })

    describe('getFilesByIds()', () => {
        it('Should return array files by provided ids', () => {
            const file_ids = ['1', '3', '999']

            const files = testSorter.getFilesByIds(file_ids)

            expect(Array.isArray(files)).toBeTruthy()

            expect(files.length).toEqual(2)


        })
    })

    describe('validateFiles()', () => {
        it.todo('Should return successful response if all files are valid');

        it.todo('Should return an error response with list of invalid files if some files are invalid');
    })

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
            ]

            const TARGET_FOLDER = 'target_folder'
            const TARGET_FOLDER_2 = 'target_folder_2'

            const FILES_TO_MOVE_IDS = FILES_TO_MOVE.map(file => file.id)

            await testSorter.moveFiles(FILES_TO_MOVE, TARGET_FOLDER)

            let moved_files = testSorter.getFilesByIds(FILES_TO_MOVE_IDS)

            let were_moved = moved_files.every(file => file.folder === TARGET_FOLDER)

            expect(were_moved).toBeTruthy()

            await testSorter.moveFiles(FILES_TO_MOVE_IDS, TARGET_FOLDER_2)

            moved_files = testSorter.getFilesByIds(FILES_TO_MOVE_IDS)

            were_moved = moved_files.every(file => file.folder === TARGET_FOLDER_2)

            expect(were_moved).toBeTruthy()
        })

        it('Should return failed files and not move them if there are any', () => {

        })
    })

    describe('Logs should not show up if they are disabled', () => {

        let log_spy = jest.spyOn(console, 'log')

        testSorter.setLogs(false)

        log_spy.mockClear()
        testSorter.moveFiles(['1', '2', '3'], 'placeholder')

        expect(log_spy).not.toHaveBeenCalled()
    })
})