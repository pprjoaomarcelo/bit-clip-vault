import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('SovereignComm Gateway is running!');
});

app.listen(port, () => {
  console.log(`Gateway server listening on port ${port}`);
});
