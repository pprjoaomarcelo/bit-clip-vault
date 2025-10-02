import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NetworkBadge } from "./NetworkBadge";
import { ExternalLink, Lock, Unlock, Send, Inbox, AlertCircle, CheckCircle2 } from "lucide-react";

interface Message {
  id: string;
  user_address: string;
  recipient_address: string;
  content: string;
  encrypted: boolean;
  network: string;
  network_type: string;
  tx_hash: string | null;
  status: string;
  created_at: string;
}

interface MessageCardProps {
  message: Message;
  userAddress: string;
}

export const MessageCard = ({ message, userAddress }: MessageCardProps) => {
  const formatAddress = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const isSent = message.user_address.toLowerCase() === userAddress.toLowerCase();
  const otherAddress = isSent ? message.recipient_address : message.user_address;

  const getExplorerUrl = () => {
    if (!message.tx_hash) return '#';
    
    const explorerUrls: Record<string, string> = {
      ethereum: `https://etherscan.io/tx/${message.tx_hash}`,
      arbitrum: `https://arbiscan.io/tx/${message.tx_hash}`,
      optimism: `https://optimistic.etherscan.io/tx/${message.tx_hash}`,
      base: `https://basescan.org/tx/${message.tx_hash}`,
      zksync: `https://explorer.zksync.io/tx/${message.tx_hash}`,
      polygon: `https://polygonscan.com/tx/${message.tx_hash}`,
      solana: `https://explorer.solana.com/tx/${message.tx_hash}`,
      bitcoin: `https://blockchair.com/bitcoin/transaction/${message.tx_hash}`,
    };

    return explorerUrls[message.network] || '#';
  };

  return (
    <Card className="p-4 hover:bg-secondary/50 transition-all border-border bg-card/50 backdrop-blur-sm">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {isSent ? (
                <Badge variant="outline" className="gap-1">
                  <Send className="w-3 h-3" />
                  Sent
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <Inbox className="w-3 h-3" />
                  Received
                </Badge>
              )}
              
              {message.status === 'success' && (
                <Badge variant="default" className="gap-1 bg-green-500/20 text-green-500 border-green-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  Confirmed
                </Badge>
              )}
              
              {message.status === 'failed' && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Failed
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground font-mono">
                {isSent ? 'To:' : 'From:'}
              </span>
              <span className="text-sm font-mono text-foreground truncate">
                {formatAddress(otherAddress)}
              </span>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <NetworkBadge network={message.network as any} />
              <span className="text-xs text-muted-foreground">{formatDate(message.created_at)}</span>
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

        {message.tx_hash && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground font-mono truncate flex-1">
              TX: {formatAddress(message.tx_hash)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-primary hover:text-primary/80 shrink-0"
              onClick={() => window.open(getExplorerUrl(), '_blank')}
            >
              <ExternalLink className="w-3 h-3" />
              Explorer
            </Button>
          </div>
        )}

        {!message.tx_hash && message.status === 'failed' && (
          <div className="text-xs text-destructive">
            Transaction failed - no hash available
          </div>
        )}
      </div>
    </Card>
  );
};
