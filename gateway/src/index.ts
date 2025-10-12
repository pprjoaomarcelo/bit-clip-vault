import express, { Request, Response } from 'express';
import { create } from 'ipfs-http-client';

// Create an IPFS client
const ipfs = create({ url: 'https://ipfs.infura.io:5001/api/v0' });

const app = express();
const port = process.env.PORT || 3000;

// Add this line to enable JSON body parsing
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('SovereignComm Gateway is running!');
});

app.post('/messages', async (req: Request, res: Response) => {
  console.log('Received new message:', req.body);
  
  const { content, recipient } = req.body;

  if (!content || !recipient) {
    return res.status(400).json({ error: 'Message content and recipient are required.' });
  }

  try {
    // Add the message content to IPFS
    const { cid } = await ipfs.add(JSON.stringify({ content, recipient }));
    console.log('Added to IPFS with CID:', cid.toString());

    res.status(201).json({ 
      status: 'Message processed by gateway', 
      timestamp: new Date().toISOString(),
      ipfs_cid: cid.toString()
    });
  } catch (error) {
    console.error('Error adding to IPFS:', error);
    res.status(500).json({ error: 'Failed to process message with IPFS.' });
  }
});

app.listen(port, () => {
  console.log(`Gateway server listening on port ${port}`);
});
