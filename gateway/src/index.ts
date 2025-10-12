import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 3000;

// Add this line to enable JSON body parsing
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('SovereignComm Gateway is running!');
});

app.post('/messages', (req: Request, res: Response) => {
  console.log('Received new message:', req.body);
  
  const { content, recipient } = req.body;

  if (!content || !recipient) {
    return res.status(400).json({ error: 'Message content and recipient are required.' });
  }

  // TODO: Process the message (IPFS, Blockchain, Lightning)

  res.status(201).json({ 
    status: 'Message received', 
    timestamp: new Date().toISOString(),
    // In a real scenario, we would return something like a transaction ID or a CID here
  });
});

app.listen(port, () => {
  console.log(`Gateway server listening on port ${port}`);
});
