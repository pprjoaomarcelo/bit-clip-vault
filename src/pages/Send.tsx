import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Send as SendIcon, AlertCircle, Info, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { detectNetwork } from "@/lib/mockData";
import { NetworkBadge } from "@/components/NetworkBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [showPreview, setShowPreview] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState<string>("0");

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
      const network = detectNetwork(value);
      setRecipientNetwork(network);
      // Simulate fee estimation based on network
      if (network === "ethereum") {
        setEstimatedFee("0.0024");
      } else if (network === "bitcoin") {
        setEstimatedFee("0.00015");
      } else if (network === "solana") {
        setEstimatedFee("0.000005");
      }
    } else {
      setRecipientNetwork(null);
      setEstimatedFee("0");
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

  const handlePrepareTransaction = () => {
    if (!recipient || !message) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (!recipientNetwork || recipientNetwork === "unknown") {
      toast({
        title: "Endereço inválido",
        description: "Por favor, insira um endereço blockchain válido",
        variant: "destructive",
      });
      return;
    }

    // Simulate balance check (mock)
    const mockBalance = Math.random();
    if (mockBalance < 0.3) {
      toast({
        title: "Saldo insuficiente",
        description: `Você não tem saldo suficiente para pagar a taxa de rede estimada (${estimatedFee} ${recipientNetwork.toUpperCase()})`,
        variant: "destructive",
      });
      return;
    }

    // Show preview
    setShowPreview(true);
  };

  const handleConfirmSend = () => {
    // Generate mock transaction payload
    const payload = {
      to: recipient,
      data: encrypted ? "[ENCRYPTED]" : message,
      network: recipientNetwork,
      fee: estimatedFee,
      timestamp: new Date().toISOString(),
    };

    console.log("Transaction payload:", payload);
    setShowPreview(false);

    // Simulate transaction sending
    const success = Math.random() > 0.2;
    
    if (success) {
      toast({
        title: "Transação enviada",
        description: "Sua mensagem foi enviada para a blockchain. Aguarde confirmação.",
      });
      
      // Reset form
      setTimeout(() => {
        setRecipient("");
        setMessage("");
        setEncrypted(false);
        setRecipientNetwork(null);
      }, 1500);
    } else {
      toast({
        title: "Erro ao enviar transação",
        description: "A transação foi rejeitada. Verifique sua carteira e tente novamente.",
        variant: "destructive",
      });
    }
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

            {recipientNetwork && estimatedFee !== "0" && (
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Taxa estimada</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      {estimatedFee} {recipientNetwork.toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">Taxa de rede</p>
                  </div>
                </div>
              </Card>
            )}

            <Button 
              onClick={handlePrepareTransaction}
              disabled={!connected || !recipient || !message}
              className="w-full h-12 gap-2 bg-primary hover:bg-primary/90 text-black font-semibold"
            >
              <SendIcon className="w-5 h-5" />
              Revisar e Enviar
            </Button>
          </div>
        </Card>

        <AlertDialog open={showPreview} onOpenChange={setShowPreview}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <SendIcon className="w-5 h-5 text-primary" />
                Confirmar Transação
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Para:</span>
                      <span className="font-mono text-xs">{recipient.slice(0, 10)}...{recipient.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Rede:</span>
                      <NetworkBadge network={recipientNetwork || "unknown"} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Mensagem:</span>
                      <span className="font-medium">
                        {encrypted ? "🔒 Criptografada" : "📝 Pública"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
                      <span className="text-muted-foreground">Taxa de rede:</span>
                      <span className="font-bold text-primary">
                        {estimatedFee} {recipientNetwork?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <Card className="p-3 bg-secondary/50">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Esta transação será permanente e não pode ser revertida. 
                      Certifique-se de que todos os detalhes estão corretos antes de confirmar.
                    </p>
                  </Card>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmSend}
                className="bg-primary hover:bg-primary/90 text-black"
              >
                Confirmar Envio
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
