import { google } from 'googleapis';

export default function driveInstance(authClient) {
    return google.drive({ version: 'v3', auth: authClient })
}