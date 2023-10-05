import * as express from 'express';
import { Request, Response } from 'express';
import Logger from './Logger';
import { authorize, driveInstance, GoogleDriveSorter } from './google'

const ENABLE_LOGS = true
const SORTER_CONFIG = {
    enable_logs: true,
    logs_filter: null
}

const logger = new Logger(ENABLE_LOGS, 'Server')

const app = express();

const PORT = process.env.PORT || 8000;

let googleClient = null;

authorize()
    .then((client) => {
        googleClient = client;
    })
    .catch(console.error)

app.use(express.json())

app.get('/', (req: Request, res: Response) => {
    //googleAuth().then(console.log).catch(console.error)
    res.send('Helloooo!')
})
//
app.post('/api/sort', async (req: Request, res: Response, next) => {
    try {
        const {
            conditions,
            action
        } = req.body;
    
        logger.log('Sorting cloud storage folder', 'api/sort');
        if(!googleClient) {
            logger.log('Could not authorize Google account');
            res.send('Could not authorize Google account').status(401);
            next();
        }
    
        const drive = driveInstance(googleClient)
    
        const driveSorter = new GoogleDriveSorter(drive, SORTER_CONFIG);
    
    
        const files = await driveSorter.sort(conditions, action)
    
        logger.log('Sorted files')
    
        res.json(files)
    } catch (e) {
        res.json({
            message: e.message
        }).status(500)
    }
    
})

app.listen(PORT, () => {
    console.log(`FileSorter server listening on port ${PORT}`)
})