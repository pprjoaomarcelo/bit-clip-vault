import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NetworkBadge } from "./NetworkBadge";
import { ExternalLink, Lock, Unlock, Eye, Loader2 } from "lucide-react";

// Representa a estrutura de uma mensagem como definida no Inbox.tsx
interface Message {
  id: string;
  user_address: string;
  recipient_address: string;
  content: string;
  encrypted: boolean;
  network: string;
  network_type: string;
  tx_hash: string | null;
  raw_content?: string | null;
}

type DecryptionStatus = 'idle' | 'fetching' | 'decrypting' | 'decrypted' | 'error';

interface MessageCardProps {
  message: Message;
  userAddress: string;
  isSent: boolean;
  onDecrypt: (messageId: string) => Promise<string | null>;
}

export const MessageCard = ({ message, userAddress, isSent, onDecrypt }: MessageCardProps) => {
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [status, setStatus] = useState<DecryptionStatus>('idle');

  const formatAddress = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const otherAddress = isSent ? message.recipient_address : message.sender_address;

  const handleDecrypt = async () => {
    if (!onDecrypt) return;
    
    setStatus('fetching'); // Pode começar como 'buscando' ou 'pedindo assinatura'
    try {
      const decrypted = await onDecrypt(message.id);
      if (decrypted) {
        setDecryptedContent(decrypted);
        setStatus('decrypted');
      }
    } finally {
      if (status !== 'decrypted') setStatus('idle'); // Reseta se não foi bem sucedido
    }
  };

  const displayContent = message.encrypted 
    ? (decryptedContent || '🔒 Mensagem criptografada - clique para ver')
    : message.content;

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

  const getButtonState = () => {
    switch (status) {
      case 'fetching':
        return { text: 'Buscando no IPFS...', icon: <Loader2 className="w-3 h-3 animate-spin" />, disabled: true };
      case 'decrypting':
        return { text: 'Descriptografando...', icon: <Loader2 className="w-3 h-3 animate-spin" />, disabled: true };
      case 'decrypted':
        return { text: 'Mensagem Visível', icon: <Unlock className="w-3 h-3" />, disabled: true };
      case 'error':
        return { text: 'Tentar Novamente', icon: <Eye className="w-3 h-3" />, disabled: false };
      default:
        return { text: 'Ver Mensagem', icon: <Eye className="w-3 h-3" />, disabled: false };
    }
  };

  const buttonState = getButtonState();

  return (
    <Card className="p-4 hover:bg-secondary/50 transition-all border-border bg-card/50 backdrop-blur-sm">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
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
              <span className="text-xs text-muted-foreground">{formatDate(message.timestamp)}</span>
              {message.encrypted && (
                <div className="flex items-center gap-1 text-xs text-green-500">
                  <Lock className="w-3 h-3" />
                  <span>Encrypted</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-background/50 rounded-lg p-3 border border-border/50">
          <p className="text-sm text-foreground leading-relaxed break-words">
            {displayContent}
          </p>
          {message.encrypted && status !== 'decrypted' && onDecrypt && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 gap-2"
              onClick={handleDecrypt}
              disabled={buttonState.disabled}
            >
              {buttonState.icon}
              {buttonState.text}
            </Button>
          )}
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
      </div>
    </Card>
  );
};
