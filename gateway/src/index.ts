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
  console.log('Received new message object:', req.body);
  
  const { sender, recipient, timestamp, content, attachments } = req.body;

  // Basic validation for the new schema
  if (!sender || !recipient || !timestamp) {
    return res.status(400).json({ error: 'Sender, recipient, and timestamp are required fields.' });
  }

  // We can add more complex validation here in the future (e.g., for attachment CIDs)

  try {
    // The entire message object, conforming to our schema, is added to IPFS.
    const { cid } = await ipfs.add(JSON.stringify(req.body));
    console.log('Added message object to IPFS with CID:', cid.toString());

    res.status(201).json({ 
      status: 'Message object processed by gateway', 
      timestamp: new Date().toISOString(),
      message_cid: cid.toString()
    });
  } catch (error) {
    console.error('Error adding to IPFS:', error);
    res.status(500).json({ error: 'Failed to process message object with IPFS.' });
  }
});

app.listen(port, () => {
  console.log(`Gateway server listening on port ${port}`);
});
