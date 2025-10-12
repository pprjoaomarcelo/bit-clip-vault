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

// In-memory store for message CIDs to be batched
const cidBatch: string[] = [];
const BATCH_SIZE = 5;

app.post('/messages', async (req: Request, res: Response) => {
  console.log('Received new message object:', req.body);
  
  const { sender, recipient, timestamp, content, attachments } = req.body;

  // Basic validation for the new schema
  if (!sender || !recipient || !timestamp) {
    return res.status(400).json({ error: 'Sender, recipient, and timestamp are required fields.' });
  }

  try {
    // The entire message object, conforming to our schema, is added to IPFS.
    const { cid } = await ipfs.add(JSON.stringify(req.body));
    console.log('Added message object to IPFS with CID:', cid.toString());

    // Add the new CID to our batch
    cidBatch.push(cid.toString());
    console.log(`CID batch contains ${cidBatch.length} items.`);

    // If batch is full, process it (simulate Merkle Tree generation)
    if (cidBatch.length >= BATCH_SIZE) {
      console.log(`BATCH FULL: Processing ${cidBatch.length} CIDs.`);
      console.log('Simulating Merkle Tree generation with CIDs:', cidBatch);
      // In a real scenario, we would generate the Merkle Root and anchor it here.
      
      // Clear the batch for the next set of messages
      cidBatch.length = 0;
      console.log('Batch cleared.');
    }

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
