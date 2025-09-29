import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NetworkBadge } from "./NetworkBadge";
import { ExternalLink, Lock, Unlock } from "lucide-react";

type Network = "bitcoin" | "ethereum" | "solana" | "unknown";

interface Message {
  id: string;
  from: string;
  timestamp: Date;
  content: string;
  network: Network;
  txHash: string;
  encrypted: boolean;
}

interface MessageCardProps {
  message: Message;
}

export const MessageCard = ({ message }: MessageCardProps) => {
  const formatAddress = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const explorerUrl = {
    bitcoin: `https://blockchair.com/bitcoin/transaction/${message.txHash}`,
    ethereum: `https://etherscan.io/tx/${message.txHash}`,
    solana: `https://explorer.solana.com/tx/${message.txHash}`,
    unknown: '#'
  }[message.network];

  return (
    <Card className="p-4 hover:bg-secondary/50 transition-all border-border bg-card/50 backdrop-blur-sm">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground font-mono">From:</span>
              <span className="text-sm font-mono text-foreground truncate">{formatAddress(message.from)}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <NetworkBadge network={message.network} />
              <span className="text-xs text-muted-foreground">{formatDate(message.timestamp)}</span>
              {message.encrypted && (
                <div className="flex items-center gap-1 text-xs text-green-500">
                  <Lock className="w-3 h-3" />
                  <span>Encrypted</span>
                </div>
              )}
              {!message.encrypted && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Unlock className="w-3 h-3" />
                  <span>Public</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-background/50 rounded-lg p-3 border border-border/50">
          <p className="text-sm text-foreground leading-relaxed break-words">{message.content}</p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground font-mono truncate flex-1">
            TX: {formatAddress(message.txHash)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-primary hover:text-primary/80 shrink-0"
            onClick={() => window.open(explorerUrl, '_blank')}
          >
            <ExternalLink className="w-3 h-3" />
            Explorer
          </Button>
        </div>
      </div>
    </Card>
  );
};
