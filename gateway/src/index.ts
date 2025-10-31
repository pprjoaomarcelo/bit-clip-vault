/**
 * @file index.ts
 * @description The main entry point for the Indexer service.
 */

import express from 'express';
import type { Request, Response } from 'express';
import 'dotenv/config';

const app = express();
const PORT = process.env.INDEXER_PORT || 4000;

app.use(express.json());

/**
 * Health check endpoint.
 */
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ status: 'Indexer is running' });
});

/**
 * Endpoint for clients to fetch message pointers for a given address.
 * @route GET /messages/:userAddress
 */
app.get('/messages/:userAddress', (req: Request, res: Response) => {
  const { userAddress } = req.params;
  // TODO: Implement database lookup
  res.status(200).json({ userAddress, messages: [] });
});

app.listen(PORT, () => {
  console.log(`Indexer server listening on port ${PORT}`);
  // TODO: Start the Bitcoin listener
});