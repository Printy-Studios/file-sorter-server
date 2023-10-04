import { drive_v3 } from 'googleapis';
import Sorter, { SortCondition, SortConditionGroup, File } from '../Sorter';

type DriveFile = drive_v3.Schema$File;

export default class GoogleDriveSorter extends Sorter<drive_v3.Schema$File> {

    drive: drive_v3.Drive = null;

    constructor(driveInstance, config) {
        super(config);

        this.drive = driveInstance
    }

    conditionToQuery(condition: SortCondition) {
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

    async getFilesByConditions(conditions: SortConditionGroup[]): Promise<File[]> {
        const condition = conditions[0][0];
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
        
        const res = await this.drive.files.list({
            q,
            pageSize: 1000,
            fields: 'nextPageToken, files(id, name)'
        })

        return res.data.files as File[]
    }

    async moveFiles(files: drive_v3.Schema$File[] | string[], target_folder_name: string) {
        const target_folder = await this.getFolderByName(target_folder_name);
    
        if(typeof files[0] !== 'string') {
            throw new Error('Only file ids are currently supported');
        }

        const q = `'${target_folder.id}' in parents` 
    
        const res = [];
    
        for (const file_id of files as string[]) {
            const file = (await this.drive.files.get({
                fileId: file_id,
                fields: 'parents, name'
            })).data

            const update_res = await this.drive.files.update({
                uploadType: 'multipart',
                fileId: file_id,
                addParents: target_folder.id,
                removeParents: file.parents.join(',')
            })
    
            res.push(update_res);
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


        for (const file_id of file_ids) {
            this.drive.files.delete({
                fileId: file_id
            })
        }

        return true;
    }

    async getFilesByIds(file_ids: string[]) {

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