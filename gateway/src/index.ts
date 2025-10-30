import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { PORT } from './config.js';
import { initializeIpfsClient, addJsonToIpfs } from './services/ipfs.service.js';
import logger from './services/logger.service.js';
import { messageBatch } from './services/batch.service.js';

/**
 * Initializes services and starts the Express server.
 */
async function main() {
  try {
    initializeIpfsClient();
    logger.info('IPFS client initialized successfully.');
  } catch (error) {
    logger.crit("FATAL: Failed to initialize IPFS client. Exiting.", { error });
    process.exit(1);
  }

  const app = express();
  app.use(express.json());

  // Route for receiving new messages
  app.post('/messages', async (req: Request, res: Response, next: NextFunction) => {
    logger.info('Received new message object...');
    const messageObject = req.body;

    // Basic validation
    if (!messageObject || typeof messageObject !== 'object' || Object.keys(messageObject).length === 0) {
      return res.status(400).json({ error: 'Invalid or empty message object provided.' });
    }

    try {
      const cid = await addJsonToIpfs(messageObject);
      logger.info(`Message object added to IPFS with CID: ${cid}`);
      
      messageBatch.addCid(cid);

      res.status(202).json({ status: 'Message accepted by gateway for batching.', cid });
    } catch (error) {
      logger.error('Error processing message:', { error });
      next(error); // Pass error to the error handling middleware
    }
  });

  // Generic error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled error caught by middleware', { error: err.stack });
    res.status(500).json({ error: 'An internal server error occurred.' });
  });

  app.listen(PORT, () => {
    logger.info(`Gateway server listening on port ${PORT}`);
  });
}

main().catch(error => {
  console.error("An unhandled error occurred during startup:", error);
  process.exit(1);
});