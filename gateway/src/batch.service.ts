import { createMerkleTree } from './services/ipfs.service.js';
import { anchorMerkleRoot } from './services/bitcoin.service.js';
import logger from './services/logger.service.js';
import fs from 'fs/promises';
import { BATCH_SIZE, BATCH_TIMEOUT_MS, MAX_ANCHOR_RETRIES, INITIAL_RETRY_DELAY_MS } from '../config.js';

class MessageBatch {
  private cids: string[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.startTimer();
  }

  addCid(cid: string): void {
    this.cids.push(cid);
    logger.info(`CID ${cid} added to batch. Current size: ${this.cids.length}`);
    if (this.cids.length >= BATCH_SIZE) {
      logger.info(`Batch is full (size: ${this.cids.length}). Triggering anchor process.`);
      this.processCurrentBatch();
    }
  }

  private startTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      if (this.cids.length > 0) {
        logger.info(`Batch timeout reached. Triggering anchor process with ${this.cids.length} CIDs.`);
        this.processCurrentBatch();
      } else {
        this.startTimer(); // Restart timer if batch is empty
      }
    }, BATCH_TIMEOUT_MS);
  }

  async processCurrentBatch(): Promise<void> {
    if (this.cids.length === 0) {
      this.startTimer(); // Restart timer and exit if there's nothing to process
      return;
    }

    const batchToProcess = [...this.cids];
    this.cids = []; // Clear the batch immediately
    this.startTimer(); // Restart the timer for the next batch

    // Start processing the batch without waiting for it to complete
    this.processBatch(batchToProcess);
  }

  private async processBatch(batch: string[], attempt = 1): Promise<void> {
    logger.info(`Processing batch of ${batch.length} CIDs (Attempt ${attempt}).`);
    try {
      const tree = createMerkleTree(batch);
      const merkleRoot = tree.getRoot().toString('hex');
      await anchorMerkleRoot(merkleRoot);
      logger.info(`Batch successfully anchored with Merkle Root: ${merkleRoot}`);
    } catch (error) {
      logger.error(`ANCHORING FAILED (Attempt ${attempt}):`, { error, batch });
      this.requeueFailedBatch(batch, attempt);
    }
  }

  private async requeueFailedBatch(failedBatch: string[], previousAttempt: number): Promise<void> {
    if (previousAttempt >= MAX_ANCHOR_RETRIES) {
      logger.crit(`CRITICAL: Batch failed after ${MAX_ANCHOR_RETRIES} attempts. Saving to DLQ.`, { failedBatch });
      try {
        const dlqEntry = {
          timestamp: new Date().toISOString(),
          reason: `Batch failed after ${MAX_ANCHOR_RETRIES} attempts.`,
          batch: failedBatch,
        };
        await fs.appendFile('dead-letter-queue.log', JSON.stringify(dlqEntry) + '\n');
      } catch (dlqError) {
        logger.crit('CRITICAL: FAILED TO WRITE TO DEAD LETTER QUEUE.', { dlqError });
      }
      return;
    }

    const nextAttempt = previousAttempt + 1;
    const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, previousAttempt - 1);

    logger.warn(`Re-queueing failed batch. Next attempt (${nextAttempt}) in ${delay / 60000} minutes.`);
    setTimeout(() => this.processBatch(failedBatch, nextAttempt), delay);
  }
}

export const messageBatch = new MessageBatch();