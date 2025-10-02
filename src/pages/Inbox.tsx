import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { MessageCard } from "@/components/MessageCard";
import { Button } from "@/components/ui/button";
import { RefreshCw, Inbox as InboxIcon, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { requestWalletSignature, decryptMessage } from "@/lib/encryption";

interface DBMessage {
  id: string;
  user_address: string;
  recipient_address: string;
  content: string;
  encrypted: boolean;
  network: string;
  network_type: string;
  tx_hash: string | null;
  storage_provider: string;
  storage_cid: string;
  storage_url: string;
  gas_fee: number | null;
  status: string;
  direction: string;
  created_at: string;
}

export default function Inbox() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("all");
  const [walletSignature, setWalletSignature] = useState<string | null>(null);

  useEffect(() => {
    const walletData = sessionStorage.getItem('wallet');
    if (walletData) {
      const parsed = JSON.parse(walletData);
      setConnected(parsed.connected);
      setAddress(parsed.address);
    }
  }, []);

  useEffect(() => {
    if (address) {
      fetchMessages();
    } else {
      setLoading(false);
    }
  }, [address]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`user_address.eq.${address},recipient_address.eq.${address}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMessages(data || []);
      
      // Check if there are encrypted messages and we need signature
      const hasEncryptedMessages = data?.some(msg => msg.encrypted) || false;
      if (hasEncryptedMessages && !walletSignature) {
        // We'll request signature when user tries to view encrypted message
        console.log("[Inbox] Encrypted messages found, signature will be requested when viewing");
      }
    } catch (error: any) {
      console.error("[Inbox] Error fetching messages:", error);
      toast({
        title: "Error loading messages",
        description: error.message || "Failed to fetch messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDecryptMessage = async (messageId: string): Promise<string | null> => {
    try {
      // Request signature if we don't have it yet
      if (!walletSignature) {
        console.log("[Inbox] Requesting wallet signature for decryption...");
        const signature = await requestWalletSignature(address);
        setWalletSignature(signature);
        
        // Find message and decrypt
        const message = messages.find(m => m.id === messageId);
        if (!message) return null;
        
        const decrypted = await decryptMessage(message.content, signature);
        return decrypted;
      } else {
        // Use existing signature
        const message = messages.find(m => m.id === messageId);
        if (!message) return null;
        
        const decrypted = await decryptMessage(message.content, walletSignature);
        return decrypted;
      }
    } catch (error: any) {
      console.error("[Inbox] Decryption failed:", error);
      toast({
        title: "Falha na descriptografia",
        description: error.message || "Não foi possível descriptografar a mensagem",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleConnect = () => {
    navigate("/connect");
  };

  const handleDisconnect = () => {
    sessionStorage.removeItem('wallet');
    setConnected(false);
    setAddress("");
    navigate("/");
    toast({
      title: "Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    toast({
      title: "Refreshing...",
      description: "Fetching latest messages",
    });
    
    await fetchMessages();
    
    setRefreshing(false);
    toast({
      title: "Inbox updated",
      description: `${messages.length} message${messages.length !== 1 ? 's' : ''} loaded`,
    });
  };

  const filteredMessages = selectedNetwork === "all" 
    ? messages 
    : messages.filter(msg => msg.network === selectedNetwork);

  const sentMessages = filteredMessages.filter(msg => 
    msg.user_address.toLowerCase() === address.toLowerCase()
  );
  
  const receivedMessages = filteredMessages.filter(msg => 
    msg.recipient_address.toLowerCase() === address.toLowerCase()
  );

  const uniqueNetworks = Array.from(new Set(messages.map(msg => msg.network)));

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        connected={connected}
        address={address}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <InboxIcon className="w-8 h-8 text-primary" />
              Messages
            </h1>
            <p className="text-muted-foreground">
              {messages.length} message{messages.length !== 1 ? 's' : ''} on-chain
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by network" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Networks</SelectItem>
                {uniqueNetworks.map((network) => (
                  <SelectItem key={network} value={network}>
                    {network.charAt(0).toUpperCase() + network.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={handleRefresh}
              disabled={refreshing || !connected}
              className="gap-2"
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {!connected && (
          <div className="mb-8 p-6 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Connect your wallet to see your messages on-chain.
            </p>
            <Button onClick={handleConnect} className="gap-2 bg-primary hover:bg-primary/90 text-black">
              Connect Wallet
            </Button>
          </div>
        )}

        {connected && (
          <>
            {loading ? (
              <div className="text-center py-16">
                <RefreshCw className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16">
                <InboxIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
                <p className="text-muted-foreground mb-6">
                  Your on-chain inbox is empty
                </p>
                <Button onClick={() => navigate('/send')} className="gap-2">
                  Send Your First Message
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="all">
                    All ({filteredMessages.length})
                  </TabsTrigger>
                  <TabsTrigger value="received">
                    Received ({receivedMessages.length})
                  </TabsTrigger>
                  <TabsTrigger value="sent">
                    Sent ({sentMessages.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  {filteredMessages.map((message) => (
                    <MessageCard 
                      key={message.id} 
                      message={message}
                      userAddress={address}
                      onDecrypt={handleDecryptMessage}
                    />
                  ))}
                </TabsContent>

                <TabsContent value="received" className="space-y-4">
                  {receivedMessages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No received messages
                    </div>
                  ) : (
                    receivedMessages.map((message) => (
                      <MessageCard 
                        key={message.id} 
                        message={message}
                        userAddress={address}
                        onDecrypt={handleDecryptMessage}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="sent" className="space-y-4">
                  {sentMessages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No sent messages
                    </div>
                  ) : (
                    sentMessages.map((message) => (
                      <MessageCard 
                        key={message.id} 
                        message={message}
                        userAddress={address}
                        onDecrypt={handleDecryptMessage}
                      />
                    ))
                  )}
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </div>
    </div>
  );
}
