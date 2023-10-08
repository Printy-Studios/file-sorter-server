import { describe, expect, it } from '@jest/globals';

import { File, fileStr } from '../src/File';

describe('fileStr()', () => {

    const PROPERTIES = [
        'id', 'name'
    ];

    const FILE: File = {
        id: 'file_id',
        name: 'file_name'
    };

    it(`Should return a stringified JSON of file properties: [${PROPERTIES.join(', ')}]`, () => {
        const FILE_STR = fileStr(FILE);

        expect(typeof FILE_STR).toBe('string');

        for(const property of PROPERTIES) {
            expect(FILE_STR).toContain(`"${property}":"${FILE[property]}"`);
        }

    });

    it('Should throw if passed argument is not an object', () => {
        const fileStrFn = (arg: any) => {
            return () => {
                fileStr(arg);
            };
        };

        const ERR_MESSAGE = 'file should be of type object';

        expect(fileStrFn('string')).toThrow(ERR_MESSAGE);
        expect(fileStrFn(123)).toThrow(ERR_MESSAGE);
        expect(fileStrFn([1, 2, 'b'])).toThrow(ERR_MESSAGE);
    });
});