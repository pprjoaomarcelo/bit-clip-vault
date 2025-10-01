import { Badge } from "@/components/ui/badge";

type Network = "bitcoin" | "ethereum" | "solana" | "arbitrum" | "optimism" | "zksync" | "base" | "unknown";

interface NetworkBadgeProps {
  network: Network;
  className?: string;
}

const networkConfig = {
  bitcoin: {
    label: "Bitcoin",
    color: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  },
  ethereum: {
    label: "Ethereum",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  },
  arbitrum: {
    label: "Arbitrum",
    color: "bg-blue-400/10 text-blue-400 border-blue-400/30",
  },
  optimism: {
    label: "Optimism",
    color: "bg-red-500/10 text-red-500 border-red-500/30",
  },
  base: {
    label: "Base",
    color: "bg-blue-600/10 text-blue-600 border-blue-600/30",
  },
  zksync: {
    label: "zkSync",
    color: "bg-purple-600/10 text-purple-600 border-purple-600/30",
  },
  solana: {
    label: "Solana",
    color: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  },
  unknown: {
    label: "Unknown",
    color: "bg-muted text-muted-foreground border-border",
  },
};

export const NetworkBadge = ({ network, className = "" }: NetworkBadgeProps) => {
  const config = networkConfig[network];
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.color} ${className} font-medium text-xs`}
    >
      {config.label}
    </Badge>
  );
};
