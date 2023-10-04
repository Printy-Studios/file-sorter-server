import { drive_v3 } from 'googleapis';
import Sorter, { SortCondition, SortConditionGroup, File } from '../Sorter';
//
export default class GoogleDriveSorter extends Sorter<drive_v3.Schema$File> {

    drive: drive_v3.Drive = null;

    constructor(driveInstance) {
        super();

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

        console.log(q)
        
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

        console.log(target_folder)
        const q = `'${target_folder.id}' in parents` 
        console.log(q);
        
    
        const res = [];
    
        for (const file_id of files as string[]) {
            const file = (await this.drive.files.get({
                fileId: file_id,
                fields: 'parents, name'
            })).data

            console.log(file)

            const update_res = await this.drive.files.update({
                uploadType: 'multipart',
                fileId: file_id,
                addParents: target_folder.id,
                removeParents: file.parents.join(',')
            })
    
            console.log('Moved file: ');
            console.log(update_res);
    
            res.push(update_res);
        }
    
        return res;
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