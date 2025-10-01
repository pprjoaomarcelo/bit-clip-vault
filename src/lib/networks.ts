// Network configurations for different blockchains and L2s
export type NetworkType = 'ethereum' | 'arbitrum' | 'optimism' | 'zksync' | 'base' | 'bitcoin' | 'solana';

export interface NetworkConfig {
  id: NetworkType;
  name: string;
  chainId?: number;
  type: 'mainnet' | 'l2';
  color: string;
  avgFee: number; // in ETH or native token
  confirmationTime: string;
  rpcUrl?: string;
}

export const NETWORKS: Record<NetworkType, NetworkConfig> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    chainId: 1,
    type: 'mainnet',
    color: 'hsl(var(--network-ethereum))',
    avgFee: 0.0024,
    confirmationTime: '~15 segundos',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/'
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum One',
    chainId: 42161,
    type: 'l2',
    color: 'hsl(var(--network-arbitrum))',
    avgFee: 0.0001,
    confirmationTime: '~2 segundos',
    rpcUrl: 'https://arb1.arbitrum.io/rpc'
  },
  optimism: {
    id: 'optimism',
    name: 'Optimism',
    chainId: 10,
    type: 'l2',
    color: 'hsl(var(--network-optimism))',
    avgFee: 0.00008,
    confirmationTime: '~2 segundos',
    rpcUrl: 'https://mainnet.optimism.io'
  },
  zksync: {
    id: 'zksync',
    name: 'zkSync Era',
    chainId: 324,
    type: 'l2',
    color: 'hsl(var(--network-zksync))',
    avgFee: 0.00005,
    confirmationTime: '~1 segundo',
    rpcUrl: 'https://mainnet.era.zksync.io'
  },
  base: {
    id: 'base',
    name: 'Base',
    chainId: 8453,
    type: 'l2',
    color: 'hsl(var(--network-base))',
    avgFee: 0.00006,
    confirmationTime: '~2 segundos',
    rpcUrl: 'https://mainnet.base.org'
  },
  bitcoin: {
    id: 'bitcoin',
    name: 'Bitcoin',
    type: 'mainnet',
    color: 'hsl(var(--network-bitcoin))',
    avgFee: 0.00015,
    confirmationTime: '~10 minutos'
  },
  solana: {
    id: 'solana',
    name: 'Solana',
    type: 'mainnet',
    color: 'hsl(var(--network-solana))',
    avgFee: 0.000005,
    confirmationTime: '~400ms',
    rpcUrl: 'https://api.mainnet-beta.solana.com'
  }
};

export const L2_NETWORKS: NetworkType[] = ['arbitrum', 'optimism', 'zksync', 'base'];

export function getNetworkConfig(network: NetworkType): NetworkConfig {
  return NETWORKS[network];
}

export function isL2Network(network: NetworkType): boolean {
  return L2_NETWORKS.includes(network);
}

/**
 * Estimate gas fee for a transaction
 */
export async function estimateGasFee(
  network: NetworkType,
  messageSize: number
): Promise<number> {
  console.log(`[Gas] Estimating fee for ${network}...`, { messageSize });
  
  const config = getNetworkConfig(network);
  
  // Simulate gas estimation based on message size
  // In production, call actual RPC methods
  const baseFee = config.avgFee;
  const sizeFactor = messageSize > 100 ? 1.5 : 1.0;
  const estimatedFee = baseFee * sizeFactor;
  
  console.log(`[Gas] Estimated fee: ${estimatedFee} for ${network}`);
  
  return estimatedFee;
}

/**
 * Check if network RPC is available
 */
export async function checkNetworkHealth(network: NetworkType): Promise<boolean> {
  console.log(`[Network] Checking health for ${network}...`);
  
  const config = getNetworkConfig(network);
  
  if (!config.rpcUrl) {
    return true; // Bitcoin doesn't have RPC in this implementation
  }
  
  try {
    // In production, make actual RPC call to check network status
    // For now, simulate a successful check
    console.log(`[Network] ${network} is healthy`);
    return true;
  } catch (error) {
    console.error(`[Network] ${network} health check failed:`, error);
    return false;
  }
}
