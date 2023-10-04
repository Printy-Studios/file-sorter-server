import * as path from 'path'
import * as fs from 'fs'
import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';

const readFile = (path: string) => {
    const content = fs.readFileSync(path, { encoding: 'utf-8'} );
    return content;
}

// If modifying these scopes, delete token.json.
const SCOPES = [
    'https://www.googleapis.com/auth/drive'
];

const TOKEN_PATH = path.join(process.cwd(), 'secret/token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'secret/credentials.json');

function loadSavedCredentialsIfExist() {
    try {
        const content = readFile(TOKEN_PATH)
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (e) {
        return null;
    }
}

function saveCredentials(client) {
    const content = readFile(CREDENTIALS_PATH)
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token
    });
    fs.writeFileSync(TOKEN_PATH, payload);
}

export async function authorize() {
    let client: any = loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH
    });
    if(client.credentials) {
        saveCredentials(client);
    }
    return client;
}

async function listFiles(authClient) {
    const drive = google.drive({ version: 'v3', auth: authClient})
    const res = await drive.files.list({
        pageSize: 10,
        fields: 'nextPageToken, files(id, name)'
    });
    const files = res.data.files;
    if(files.length === 0) {
        console.log('No files found');
        return;
    }

    console.log('Files:');
    files.map( file => {
        console.log(file.name)
    })
}

//authorize().then(listFiles).catch(console.error)