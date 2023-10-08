import { describe, it, expect } from '@jest/globals';

import driveInstance from '../../src/google/driveInstance';
import { auth } from '../../src/google/auth';
import { drive_v3 } from 'googleapis';

describe('driveInstance()', () => {
    it('Should return valid drive instance if auth client is valid', async () => {
        const client = await auth();

        const drive = driveInstance(client);

        console.log(drive);

        expect(drive).toBeInstanceOf(drive_v3.Drive);
    });

    it('Should throw error if auth client is invalid', () => {
        const invalid_client = 'hello' as any;
        
        const driveInstanceFn = () => {
            return driveInstance(invalid_client);
        };

        //console.log(driveInstance(invalid_client))

        expect(driveInstanceFn).toThrow();
    });
});