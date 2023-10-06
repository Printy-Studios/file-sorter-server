import { google } from 'googleapis';
import { JSONClient, GoogleAuth } from 'google-auth-library/build/src/auth/googleauth';
import { OAuth2Client } from 'google-auth-library';

export default function driveInstance(authClient: OAuth2Client | GoogleAuth<JSONClient>) {
    if(!(authClient instanceof OAuth2Client) && !(authClient instanceof GoogleAuth)) {
        throw new Error('authClient argument must be an instance of AuthClient')
    }
    return google.drive({ version: 'v3', auth: authClient })
}