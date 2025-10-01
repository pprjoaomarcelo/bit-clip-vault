export const mockMessages = [
  {
    id: "1",
    from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    timestamp: new Date(Date.now() - 3600000),
    content: "Welcome to Bit Clip Mail! This is a demo message showing how on-chain messages appear in your inbox. All data is permanently stored on the blockchain.",
    network: "ethereum" as const,
    txHash: "0x123abc456def789ghi012jkl345mno678pqr901stu234vwx567yz890abc",
    encrypted: false,
  },
  {
    id: "2",
    from: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    timestamp: new Date(Date.now() - 7200000),
    content: "GM! 🚀 Just wanted to say hello from the Bitcoin network. Remember: Not your keys, not your coins!",
    network: "bitcoin" as const,
    txHash: "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567890abc",
    encrypted: false,
  },
  {
    id: "3",
    from: "8FXq3KjPPgXyZxQ9X3bN5J9vM2pW4kL7sT5hN9gR6vY2",
    timestamp: new Date(Date.now() - 86400000),
    content: "🔒 This is an encrypted message. In a production environment, this content would be decrypted using your private key. Stay secure!",
    network: "solana" as const,
    txHash: "def456ghi789jkl012mno345pqr678stu901vwx234yz567890abcdef123",
    encrypted: true,
  },
];

export type NetworkType = "bitcoin" | "ethereum" | "solana" | "arbitrum" | "optimism" | "zksync" | "base" | "unknown";

export const detectNetwork = (address: string): NetworkType => {
  // Bitcoin: starts with 1, 3, or bc1
  if (address.match(/^(1|3|bc1)/)) {
    return "bitcoin";
  }
  // Ethereum: starts with 0x and is 42 chars
  if (address.match(/^0x[a-fA-F0-9]{40}$/)) {
    return "ethereum";
  }
  // Solana: base58, typically 32-44 chars
  if (address.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
    return "solana";
  }
  return "unknown";
};
