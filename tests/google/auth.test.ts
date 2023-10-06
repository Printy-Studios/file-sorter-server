import { describe, it, expect } from '@jest/globals'
import { JSONClient } from 'google-auth-library/build/src/auth/googleauth';

import { auth } from '../../src/google/auth'



describe('auth()', () => {
    it('Should authenticate and return a valid service account client', async () => {
        let client: JSONClient

        let did_throw = false

        try {
            client = await auth()
        } catch (e) {
            did_throw = true
        }

        expect(did_throw).toBeFalsy()

        expect(typeof client!).toBe('object')
    })
})

