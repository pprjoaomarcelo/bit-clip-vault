import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Send as SendIcon, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { detectNetwork } from "@/lib/mockData";
import { NetworkBadge } from "@/components/NetworkBadge";

export default function Send() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState<ReturnType<typeof detectNetwork>>("unknown");
  
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [encrypted, setEncrypted] = useState(false);
  const [recipientNetwork, setRecipientNetwork] = useState<ReturnType<typeof detectNetwork> | null>(null);

  useEffect(() => {
    const walletData = sessionStorage.getItem('wallet');
    if (walletData) {
      const parsed = JSON.parse(walletData);
      setConnected(parsed.connected);
      setAddress(parsed.address);
      setNetwork(parsed.network);
    }
  }, []);

  const handleRecipientChange = (value: string) => {
    setRecipient(value);
    if (value.length > 10) {
      setRecipientNetwork(detectNetwork(value));
    } else {
      setRecipientNetwork(null);
    }
  };

  const handleConnect = () => {
    navigate("/connect");
  };

  const handleDisconnect = () => {
    sessionStorage.removeItem('wallet');
    setConnected(false);
    navigate("/");
  };

  const handleSend = () => {
    if (!recipient || !message) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!recipientNetwork || recipientNetwork === "unknown") {
      toast({
        title: "Invalid recipient",
        description: "Please enter a valid blockchain address",
        variant: "destructive",
      });
      return;
    }

    // Generate mock transaction payload
    const payload = {
      to: recipient,
      data: encrypted ? "[ENCRYPTED]" : message,
      network: recipientNetwork,
      timestamp: new Date().toISOString(),
    };

    toast({
      title: "Message prepared",
      description: "Complete the transaction in your wallet to send",
    });

    console.log("Transaction payload:", payload);
    
    // In a real app, this would open the wallet to sign the transaction
    setTimeout(() => {
      toast({
        title: "Instructions generated",
        description: "Check the console for transaction details",
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        connected={connected}
        address={address}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <SendIcon className="w-8 h-8 text-primary" />
            Send Message
          </h1>
          <p className="text-muted-foreground">
            Compose and send an on-chain message
          </p>
        </div>

        {!connected && (
          <Card className="p-6 mb-6 bg-primary/10 border-primary/20">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">Wallet not connected</p>
                <p className="text-sm text-muted-foreground mb-4">
                  You need to connect your wallet to send messages on-chain
                </p>
                <Button onClick={handleConnect} size="sm" className="gap-2 bg-primary hover:bg-primary/90 text-black">
                  Connect Wallet
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Address *</Label>
              <Input
                id="recipient"
                placeholder="Enter Bitcoin, Ethereum, or Solana address"
                value={recipient}
                onChange={(e) => handleRecipientChange(e.target.value)}
                className="font-mono"
              />
              {recipientNetwork && recipientNetwork !== "unknown" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Detected:</span>
                  <NetworkBadge network={recipientNetwork} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-32 resize-none"
                maxLength={1000}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>This message will be stored permanently on-chain</span>
                <span>{message.length}/1000</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="space-y-1">
                <Label htmlFor="encrypted" className="cursor-pointer">Encrypt Message</Label>
                <p className="text-xs text-muted-foreground">
                  Only the recipient can decrypt and read
                </p>
              </div>
              <Switch
                id="encrypted"
                checked={encrypted}
                onCheckedChange={setEncrypted}
              />
            </div>

            <Card className="p-4 bg-blue-500/5 border-blue-500/20">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">How it works</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Clicking "Send" will generate transaction instructions. 
                    You'll need to complete the transaction in your wallet to broadcast the message on-chain. 
                    Network fees apply based on the recipient's blockchain.
                  </p>
                </div>
              </div>
            </Card>

            <Button 
              onClick={handleSend}
              disabled={!connected || !recipient || !message}
              className="w-full h-12 gap-2 bg-primary hover:bg-primary/90 text-black font-semibold"
            >
              <SendIcon className="w-5 h-5" />
              Generate Transaction
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
