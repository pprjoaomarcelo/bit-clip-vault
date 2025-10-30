/**
 * @file config.ts
 * @description Centralized configuration for the gateway.
 */

import 'dotenv/config';

export const PORT = process.env.PORT || 3000;
export const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '5', 10);
export const BATCH_TIMEOUT_MS = parseInt(process.env.BATCH_TIMEOUT_MS || '60000', 10); // 1 minute
export const MAX_ANCHOR_RETRIES = parseInt(process.env.MAX_ANCHOR_RETRIES || '3', 10); // Maximum number of retries for anchoring
export const INITIAL_RETRY_DELAY_MS = parseInt(process.env.INITIAL_RETRY_DELAY_MS || '300000', 10); // 5 minutes initial delay