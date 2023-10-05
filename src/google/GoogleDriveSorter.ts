import { drive_v3 } from 'googleapis';
import { file } from 'googleapis/build/src/apis/file';
import Sorter, { File, SortResponse } from '../Sorter';
import { Condition, ConditionGroup } from '@printy/file-sorter-common/types/Condition'

type DriveFile = drive_v3.Schema$File;

const fileStr = (file: DriveFile) => {
    return JSON.stringify({
        id: file.id,
        name: file.name
    })
}

const FOLDER_MIME = 'application/vnd.google-apps.folder';

export default class GoogleDriveSorter extends Sorter<drive_v3.Schema$File> {

    drive: drive_v3.Drive = null;

    constructor(driveInstance, config) {
        super(config);

        this.drive = driveInstance
    }

    conditionToQuery(condition: Condition) {
        const supported_premises = ['name', 'type']

        const { premise, value, condition: cond } = condition

        if (supported_premises.includes(condition.premise)) {

            if(premise === 'type') {
                switch(value) {
                    case 'folder': {
                        return `mimeType = 'application/vnd.google-apps.folder'`;
                        break; 
                    }
                    case 'file': {
                        return `mimeType != 'application/vnd.google-apps.folder'`;
                        break;
                    }
                        
                }
            }
            if(premise === 'name') {
                return `name ${condition.condition} '${condition.value}'`
            }
            
        } else {
            throw new Error(`Only ${supported_premises.join(', ')} premises currently supported`)
        }
    }

    async getFilesByConditions(conditions: ConditionGroup[]): Promise<File[]> {
        //const condition = conditions[0][0];
        let q = '';

        let is_first_group = true;
        for (const condition_group of conditions) {
            if(!is_first_group) {
                q += ' or'
            } 
            let is_first_condition = true;
            for(const condition of condition_group) {
                const condition_query = this.conditionToQuery(condition);
                if(is_first_condition) {
                    is_first_condition = false;
                    if(!is_first_group) {
                       q += ' '; 
                    } 
                    
                } else {
                    q += ' and '
                }

                q += condition_query
            }
            if (is_first_group) {
                is_first_group = false
            }
        }

        q += ' and trashed = false';

        const res = await this.drive.files.list({
            q,
            pageSize: 1000,
            fields: 'nextPageToken, files(parents, id, name)'
        })

        return res.data.files as File[]
    }

    async moveFiles(files: drive_v3.Schema$File[] | string[], target_folder_id: string) {
        const target_folder = await this.getFileById(target_folder_id);
        if(target_folder.mimeType !== FOLDER_MIME) {
            throw new Error('Provided folder ID is not for a folder');
        }


        if(typeof files[0] === 'string') {
            
            files = await this.getFilesByIds(files as string[]);
            
            //throw new Error('Only file ids are currently supported');
        } else {
            const invalid_files = []
            for (const file of files as DriveFile[]) {
                if (!file.parents) {
                   //
                   invalid_files.push(file.id)
                }
            }
            if(invalid_files.length > 0) {
                throw new Error(
                    "Cannot move files because the following files are missing the 'parents' property: " + 
                    invalid_files.join(', ')   
                ) 
            }
        }

        const q = `'${target_folder.id}' in parents` 
    
        const res: SortResponse = {
            successful: [],
            failed: []
        };
    
        console.log('moving to ', target_folder)

        for (const file of files as DriveFile[]) {
            try {
                const update_res = await this.drive.files.update({
                    uploadType: 'multipart',
                    fileId: file.id,
                    addParents: target_folder.id,
                    removeParents: file.parents.join(',')
                })
                res.successful.push(file.id)
            } catch (e) {
                console.error(`Could not move file ${fileStr(file)} to folder ${fileStr(target_folder)}`)
                res.failed.push(file.id)
            }
        }
    
        return res;
    }

    async deleteFiles(files: string[] | drive_v3.Schema$File[]) {

        let file_ids = []

        if (typeof files[0] === 'string') {
            file_ids = files;
        } else {
            file_ids = (files as DriveFile[]).map(file => file.id)
        }


        const res = {
            successful: [],
            failed: []
        }

        for (const file_id of file_ids) {
            try {
                const update_res = await this.drive.files.update({
                    fileId: file_id,
                    requestBody: {
                        trashed: true
                    }
                });
                res.successful.push(file_id)
            } catch {
                this.logger.log('Failed to delete file ' + file_id)
                res.failed.push(file_id)
            }
            
        }

        return res;
    }

    async getFilesByIds(file_ids: string[]): Promise<DriveFile[]> {

        const files = []

        for (const file_id of file_ids) {
            const file = (await this.drive.files.get({
                fileId: file_id,
                fields: 'parents, name'
            })).data

            files.push(file);
        }

        return files;
    }

    async getFileById(file_id: string): Promise<DriveFile> {
        const file = (await this.drive.files.get({
            fileId: file_id,
            fields: 'parents, name, mimeType, id'
        })).data

        return file
    }

    async getFolderByName(folder_name: string): Promise<drive_v3.Schema$File> {
        const res = await this.drive.files.list({
            q: `mimeType = 'application/vnd.google-apps.folder' and name = '${folder_name}'`,
            pageSize: 1,
            fields: 'files(id, name)'
        })
    
        const folder = res.data.files[0];
    
        return folder
    }
}