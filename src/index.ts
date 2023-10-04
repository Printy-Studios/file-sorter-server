import * as express from 'express';
import { Request, Response } from 'express';

const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
    res.send('Helloooo!')
})

app.post('/api/sort', (req: Request, res: Response) => {
    console.log('Sorting google drive folder')
})

app.listen(PORT, () => {
    console.log(`FileSorter server listening on port ${PORT}`)
})