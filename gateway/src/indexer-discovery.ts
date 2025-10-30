/**
 * @file indexer-discovery.ts
 * @description This file simulates the logic a gateway would use to recommend
 *              the best indexer service to a client based on performance and cost.
 */

/**
 * Represents the metadata advertised by an indexer service to gateways.
 */
export interface IndexerMetadata {
  name: string;
  url: string;
  // Price in satoshis per 1,000 queries.
  pricePerMille: number;
  // Last measured latency in milliseconds.
  latencyMs: number;
  // Gateway's internal reputation score for this indexer.
  reputation: number; // e.g., 0.0 to 1.0
}

// A mock list of indexers known to this gateway. In a real system,
// this list would be dynamic, updated via a B2B communication channel.
const KNOWN_INDEXERS: IndexerMetadata[] = [
  { name: 'Indexer Alpha', url: 'https://indexer-alpha.com/api', pricePerMille: 10, latencyMs: 50, reputation: 0.95 },
  { name: 'Indexer Beta', url: 'https://indexer-beta.net/v1', pricePerMille: 8, latencyMs: 150, reputation: 0.99 },
  { name: 'Indexer Gamma', url: 'https://gamma-idx.org', pricePerMille: 12, latencyMs: 30, reputation: 0.85 },
];

/**
 * Recommends the best indexer based on a simple scoring model.
 * This logic would live inside the gateway software.
 * @returns The URL of the recommended indexer.
 */
export function recommendIndexer(): string {
  console.log('[Gateway] Recommending an indexer for client...');

  // Simple scoring: lower is better.
  // We weigh price and latency. Reputation acts as a multiplier.
  const scoredIndexers = KNOWN_INDEXERS.map(indexer => {
    const score = (indexer.pricePerMille * 0.7) + (indexer.latencyMs * 0.3);
    const finalScore = score / indexer.reputation; // Higher reputation lowers the score (making it better)
    return { ...indexer, finalScore };
  });

  // Sort by the final score, ascending.
  scoredIndexers.sort((a, b) => a.finalScore - b.finalScore);

  const bestIndexer = scoredIndexers[0];
  console.log(`[Gateway] Recommended indexer: ${bestIndexer.name} with score ${bestIndexer.finalScore.toFixed(2)}`);

  return bestIndexer.url;
}