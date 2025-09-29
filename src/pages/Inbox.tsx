import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { MessageCard } from "@/components/MessageCard";
import { Button } from "@/components/ui/button";
import { RefreshCw, Inbox as InboxIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mockMessages } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";

export default function Inbox() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [messages, setMessages] = useState(mockMessages);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const walletData = sessionStorage.getItem('wallet');
    if (walletData) {
      const parsed = JSON.parse(walletData);
      setConnected(parsed.connected);
      setAddress(parsed.address);
    }
  }, []);

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
      title: "Scanning blockchain...",
      description: "Looking for new messages",
    });
    
    // Simulate blockchain scan
    setTimeout(() => {
      setRefreshing(false);
      toast({
        title: "Inbox updated",
        description: "No new messages found",
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        connected={connected}
        address={address}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <InboxIcon className="w-8 h-8 text-primary" />
              Inbox
            </h1>
            <p className="text-muted-foreground">
              {messages.length} message{messages.length !== 1 ? 's' : ''} on-chain
            </p>
          </div>

          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Scanning...' : 'Refresh'}
          </Button>
        </div>

        {!connected && (
          <div className="mb-8 p-6 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              You're viewing demo messages. Connect your wallet to see your actual inbox.
            </p>
            <Button onClick={handleConnect} className="gap-2 bg-primary hover:bg-primary/90 text-black">
              Connect Wallet
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message) => (
            <MessageCard key={message.id} message={message} />
          ))}
        </div>

        {messages.length === 0 && (
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
        )}
      </div>
    </div>
  );
}
