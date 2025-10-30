/**
 * @file bitcoinfees.service.ts
 * @description This file contains the logic for fetching Bitcoin fee rate estimations.
 */

import axios from 'axios';
import logger from './logger.service.js';

const MEMPOOL_SPACE_API_URL = 'https://mempool.space/testnet/api/v1/fees/recommended';

/**
 * Represents the recommended Bitcoin fee rates in satoshis per virtual byte (sat/vB).
 */
export interface FeeRates {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

// Simple in-memory cache with a timestamp to avoid excessive API calls.
let cachedFeeRates: { rates: FeeRates; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches the recommended fee rates from the mempool.space API.
 * It uses an in-memory cache to avoid fetching on every single request.
 * @returns A promise that resolves with the current fee rate recommendations.
 */
export async function getRecommendedFees(): Promise<FeeRates> {
  const now = Date.now();

  if (cachedFeeRates && (now - cachedFeeRates.timestamp < CACHE_TTL_MS)) {
    logger.info('[BitcoinFees] Returning cached fee rates.');
    return cachedFeeRates.rates;
  }

  logger.info('[BitcoinFees] Fetching recommended fee rates from mempool.space...');
  const { data } = await axios.get<FeeRates>(MEMPOOL_SPACE_API_URL);

  cachedFeeRates = {
    rates: data,
    timestamp: now,
  };

  return data;
}