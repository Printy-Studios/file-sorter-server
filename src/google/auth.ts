import * as path from 'path'
import * as fs from 'fs'
import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';
import Logger from 'Logger';
import { AuthClient } from 'google-auth-library';
import { GoogleAuth, JSONClient } from 'google-auth-library/build/src/auth/googleauth';

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
const SERVICE_CREDENTIALS_PATH = path.join(process.cwd(), 'secret/service-account-credentials.json')

function loadSavedCredentialsIfExist() {
    try {
        const content = readFile(TOKEN_PATH)
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (e) {
        return null;
    }
}

function readFileJSON(file_path: string) {
    const content = readFile(file_path);
    const json = JSON.parse(content);
    return json;
}

function saveCredentials(client) {
    const content = readFile(CREDENTIALS_PATH);
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

export async function localAuth() {
    let client: AuthClient = loadSavedCredentialsIfExist();
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

export async function auth() {
    const client = new google.auth.GoogleAuth({
        keyFile: SERVICE_CREDENTIALS_PATH,
        scopes: SCOPES
    })
    
    if(!client) {
        throw new Error('Failed to authorize Google service account')
    }

    return client;
}