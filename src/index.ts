import * as express from 'express';
import { Request, Response } from 'express';
import { moveFiles, authorize, driveInstance, GoogleDriveSorter } from './google'

const app = express();

const PORT = process.env.PORT || 3000;

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

    const {
        conditions,
        action
    } = req.body
//
    console.log('Sorting google drive folder')
    if(!googleClient) {
        res.send('Could not authorize Google account').status(401);
        next();
    }

    const drive = driveInstance(googleClient)

    const driveSorter = new GoogleDriveSorter(drive);


    const files = await driveSorter.sort(conditions, action)

    console.log('Moving files')
    //const files = await moveFiles(drive, [], 'Blog')
    res.json(files)
})

app.listen(PORT, () => {
    console.log(`FileSorter server listening on port ${PORT}`)
})