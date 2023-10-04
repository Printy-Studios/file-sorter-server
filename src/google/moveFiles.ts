import { drive_v3, google } from 'googleapis'

type DriveFile = {
    id?: string,
    name?: string
}

async function getFolderByName(drive, folder_name: string): Promise<drive_v3.Schema$File> {

    const res = await drive.files.list({
        q: `mimeType = 'application/vnd.google-apps.folder' and name = '${folder_name}'`,
        pageSize: 1,
        fields: 'files(id, name)'
    })

    const folder = res.data.files[0];

    return folder

}

export default async function moveFiles(drive: drive_v3.Drive, files_ids: string[], target_folder_name: string) {
    

    const target_folder = await getFolderByName(drive, target_folder_name);

    console.log(target_folder)
    const q = `'${target_folder.id}' in parents` 
    console.log(q);
    const files_res = await drive.files.list({
        q,
        pageSize: 1000,
        fields: 'nextPageToken, files(id, name)'
    })

    const res = [];

    for (const file of files_res.data.files) {
        const update_res = await drive.files.update({
            uploadType: 'multipart',
            fileId: file.id,
            addParents: target_folder.id,
            removeParents: target_folder.parents.join(',')
        })

        console.log('Moved file: ');
        console.log(update_res);

        res.push(update_res);
    }

    return res;
}