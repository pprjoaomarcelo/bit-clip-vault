import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Lock, Send as SendIcon, DollarSign, Database, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { detectNetwork, type NetworkType } from "@/lib/mockData";
import { NetworkBadge } from "@/components/NetworkBadge";
import { Navbar } from "@/components/Navbar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadToDecentralizedStorage, compressMessage, type StorageProvider } from "@/lib/storage";
import { encryptMessage } from "@/lib/encryption";
import { NETWORKS, estimateGasFee, L2_NETWORKS, checkNetworkHealth, type NetworkType as NetType } from "@/lib/networks";
import { chooseSolanaMethod, sendViaMemo, sendViaDedicatedAccount } from "@/lib/solana";

export default function Send() {
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [detectedNetwork, setDetectedNetwork] = useState<NetworkType>("unknown");
  const [selectedNetwork, setSelectedNetwork] = useState<NetType | "unknown" | "">("");
  const [estimatedFee, setEstimatedFee] = useState<number>(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [storageProvider, setStorageProvider] = useState<StorageProvider>("ipfs");
  const [storagePointer, setStoragePointer] = useState<string>("");

  useEffect(() => {
    const walletData = sessionStorage.getItem("wallet");
    if (walletData) {
      const data = JSON.parse(walletData);
      setConnected(data.connected || false);
      setAddress(data.address || "");
    }
  }, []);

  const handleConnect = () => {
    navigate("/connect");
  };

  const handleDisconnect = () => {
    sessionStorage.removeItem("wallet");
    setConnected(false);
    setAddress("");
    navigate("/");
    toast({
      title: "Desconectado",
      description: "Sua carteira foi desconectada.",
    });
  };

  const handleRecipientChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRecipient(value);
    
    if (value.trim()) {
      const network = detectNetwork(value);
      setDetectedNetwork(network);
      
      // For Ethereum addresses, default to Arbitrum (cheapest L2)
      if (network === "ethereum") {
        setSelectedNetwork("arbitrum");
      } else if (network !== "unknown") {
        setSelectedNetwork(network as NetType);
      }
      
      // Estimate fee based on selected network and message size
      if (message.trim() && network !== "unknown") {
        const fee = await estimateGasFee(
          network === "ethereum" ? "arbitrum" : network as NetType,
          message.length
        );
        setEstimatedFee(fee);
      }
    } else {
      setDetectedNetwork("unknown");
      setSelectedNetwork("");
      setEstimatedFee(0);
    }
  };

  const handlePrepareTransaction = async () => {
    if (!recipient.trim()) {
      toast({
        title: "❌ Erro de validação",
        description: "Por favor, insira um endereço de destino.",
        variant: "destructive"
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "❌ Erro de validação",
        description: "Por favor, insira uma mensagem.",
        variant: "destructive"
      });
      return;
    }

    if (!detectedNetwork || detectedNetwork === "unknown" || !selectedNetwork) {
      toast({
        title: "❌ Rede não detectada",
        description: "Não foi possível detectar a rede do endereço fornecido.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Check network health
      const networkHealthy = await checkNetworkHealth(selectedNetwork as NetType);
      if (!networkHealthy) {
        toast({
          title: "⚠️ Problema na rede",
          description: `A rede ${NETWORKS[selectedNetwork].name} está temporariamente indisponível. Tente novamente mais tarde.`,
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      // Estimate gas fee
      const fee = await estimateGasFee(selectedNetwork as NetType, message.length);
      setEstimatedFee(fee);

      // Simulate balance check
      const hasBalance = Math.random() > 0.2; // 80% success rate for demo
      if (!hasBalance) {
        toast({
          title: "💰 Saldo insuficiente",
          description: `Você precisa de aproximadamente ${fee.toFixed(6)} ${selectedNetwork === 'solana' ? 'SOL' : 'ETH'} para cobrir a taxa de rede.`,
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      // Process message for storage
      let messageToStore = message;
      
      // For Solana, compress if needed
      if (selectedNetwork === 'solana') {
        messageToStore = compressMessage(message);
        console.log(`[Send] Message compressed for Solana`);
      }

      // Encrypt if needed
      if (isEncrypted) {
        const { encryptedMessage } = await encryptMessage(messageToStore, recipient);
        messageToStore = encryptedMessage;
        console.log(`[Send] Message encrypted`);
      }

      // Upload to decentralized storage
      const storageResult = await uploadToDecentralizedStorage(messageToStore, storageProvider);
      setStoragePointer(storageResult.cid || storageResult.txId || "");
      
      console.log(`[Send] Content uploaded to ${storageProvider}:`, storageResult);

      setShowPreview(true);
    } catch (error) {
      console.error('[Send] Transaction preparation failed:', error);
      toast({
        title: "❌ Erro na preparação",
        description: error instanceof Error ? error.message : "Falha ao preparar transação. Verifique sua conexão e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmSend = async () => {
    setIsProcessing(true);
    
    try {
      let txSignature: string;

      // Handle Solana-specific sending
      if (selectedNetwork === 'solana') {
        const solanaMethod = chooseSolanaMethod(message.length);
        
        if (solanaMethod === 'memo') {
          txSignature = await sendViaMemo(storagePointer, recipient, connected);
          console.log(`[Send] Sent via Solana Memo:`, txSignature);
        } else {
          txSignature = await sendViaDedicatedAccount(storagePointer, recipient, connected);
          console.log(`[Send] Sent via Solana Dedicated Account:`, txSignature);
        }
      } else {
        // Simulate Ethereum/L2 transaction
        txSignature = `0x${Math.random().toString(16).substring(2, 15)}${Math.random().toString(16).substring(2, 15)}`;
        console.log(`[Send] Sent on ${NETWORKS[selectedNetwork as NetType].name}:`, txSignature);
      }

      // Simulate potential errors
      const errorTypes = ['nonce', 'rpc', null];
      const randomError = Math.random() > 0.85 ? errorTypes[Math.floor(Math.random() * errorTypes.length)] : null;

      if (randomError === 'nonce') {
        throw new Error('Erro de nonce: A transação foi rejeitada devido a um nonce incorreto. Aguarde e tente novamente.');
      } else if (randomError === 'rpc') {
        throw new Error('Erro de RPC: Não foi possível conectar ao nó da blockchain. Verifique sua conexão.');
      }

      toast({
        title: "✅ Mensagem enviada!",
        description: (
          <div className="space-y-1">
            <p>Sua mensagem foi enviada com sucesso via {NETWORKS[selectedNetwork as NetType].name}.</p>
            <p className="text-xs font-mono truncate">TX: {txSignature}</p>
            <p className="text-xs text-muted-foreground">
              {isEncrypted ? '🔒 Mensagem criptografada' : '🌐 Mensagem pública'} • 
              📦 Storage: {storageProvider.toUpperCase()}
            </p>
          </div>
        ),
      });
      
      // Reset form
      setRecipient("");
      setMessage("");
      setIsEncrypted(true);
      setDetectedNetwork("unknown");
      setSelectedNetwork("");
      setEstimatedFee(0);
      setShowPreview(false);
      setStoragePointer("");
    } catch (error) {
      console.error('[Send] Transaction failed:', error);
      
      toast({
        title: "❌ Erro ao enviar transação",
        description: error instanceof Error ? error.message : "Falha desconhecida. Por favor, tente novamente.",
        variant: "destructive"
      });
      setShowPreview(false);
    } finally {
      setIsProcessing(false);
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

      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SendIcon className="h-5 w-5" />
              Enviar Mensagem
            </CardTitle>
            <CardDescription>
              Envie mensagens criptografadas via blockchain com storage descentralizado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!connected && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Conecte sua carteira para enviar mensagens on-chain.
                  <Button onClick={handleConnect} size="sm" className="ml-4">
                    Conectar Carteira
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="recipient">Endereço de destino</Label>
              <Input
                id="recipient"
                placeholder="0x... / bc1... / Sol..."
                value={recipient}
                onChange={handleRecipientChange}
              />
              {detectedNetwork && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <NetworkBadge network={detectedNetwork} />
                  </div>
                  
                  {/* Network selector for EVM addresses */}
                  {detectedNetwork === "ethereum" && (
                    <div className="space-y-2">
                      <Label htmlFor="network">Selecione a rede (L2 recomendado)</Label>
                      <Select
                        value={selectedNetwork}
                        onValueChange={async (value: NetType) => {
                          setSelectedNetwork(value);
                          if (message.trim()) {
                            const fee = await estimateGasFee(value, message.length);
                            setEstimatedFee(fee);
                          }
                        }}
                      >
                        <SelectTrigger id="network">
                          <SelectValue placeholder="Escolha uma rede" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ethereum">
                            <div className="flex items-center justify-between w-full">
                              <span>Ethereum (Mainnet)</span>
                              <span className="text-xs text-muted-foreground ml-2">~0.0024 ETH</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="arbitrum">
                            <div className="flex items-center justify-between w-full">
                              <span>⚡ Arbitrum One (L2)</span>
                              <span className="text-xs text-success ml-2">~0.0001 ETH</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="optimism">
                            <div className="flex items-center justify-between w-full">
                              <span>⚡ Optimism (L2)</span>
                              <span className="text-xs text-success ml-2">~0.00008 ETH</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="base">
                            <div className="flex items-center justify-between w-full">
                              <span>⚡ Base (L2)</span>
                              <span className="text-xs text-success ml-2">~0.00006 ETH</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="zksync">
                            <div className="flex items-center justify-between w-full">
                              <span>⚡ zkSync Era (L2)</span>
                              <span className="text-xs text-success ml-2">~0.00005 ETH</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {selectedNetwork && L2_NETWORKS.includes(selectedNetwork as NetType) && (
                        <p className="text-xs text-success">
                          ✨ L2 selecionado - taxas até 95% mais baixas!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Digite sua mensagem aqui..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="encryption"
                  checked={isEncrypted}
                  onCheckedChange={setIsEncrypted}
                />
                <Label htmlFor="encryption" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Criptografar mensagem (cliente)
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {isEncrypted 
                  ? "🔒 Mensagem será criptografada localmente antes de ser enviada. Apenas o destinatário poderá ler." 
                  : "🌐 Mensagem pública - qualquer pessoa poderá ler o conteúdo."}
              </p>
            </div>

            {/* Storage provider selection */}
            <div className="space-y-2">
              <Label htmlFor="storage">Armazenamento descentralizado</Label>
              <Select
                value={storageProvider}
                onValueChange={(value: StorageProvider) => setStorageProvider(value)}
              >
                <SelectTrigger id="storage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ipfs">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span>IPFS (InterPlanetary File System)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="arweave">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span>Arweave (Permanente)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Apenas o pointer será armazenado on-chain, reduzindo custos
              </p>
            </div>

            {estimatedFee > 0 && selectedNetwork && (
              <Card className="bg-card/50 border-success/20">
                <CardContent className="pt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">Taxa estimada</span>
                    </div>
                    <span className="text-sm font-mono font-semibold">
                      {estimatedFee.toFixed(6)} {selectedNetwork === 'solana' ? 'SOL' : selectedNetwork === 'bitcoin' ? 'BTC' : 'ETH'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Rede: {NETWORKS[selectedNetwork as NetType].name} • 
                    Confirmação: {NETWORKS[selectedNetwork as NetType].confirmationTime}
                  </div>
                  {selectedNetwork === 'solana' && (
                    <p className="text-xs text-info">
                      ℹ️ Método: {chooseSolanaMethod(message.length) === 'memo' ? 'Memo Program' : 'Dedicated Account'}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Button 
              className="w-full" 
              size="lg"
              onClick={handlePrepareTransaction}
              disabled={!connected || isProcessing || !selectedNetwork}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preparando...
                </>
              ) : (
                <>
                  <SendIcon className="mr-2 h-4 w-4" />
                  Revisar e Enviar
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showPreview} onOpenChange={setShowPreview}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Envio</AlertDialogTitle>
            <AlertDialogDescription>
              Revise os detalhes da sua transação antes de confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Para:</div>
              <div className="text-sm text-muted-foreground font-mono break-all">{recipient}</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Rede:</div>
              {selectedNetwork && <NetworkBadge network={selectedNetwork} />}
              <div className="text-xs text-muted-foreground">
                {selectedNetwork && NETWORKS[selectedNetwork as NetType].name}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Mensagem:</div>
              <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto p-2 bg-muted/50 rounded">
                {isEncrypted ? "🔒 Mensagem criptografada (não visível)" : message}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Armazenamento:</div>
              <div className="text-sm text-muted-foreground">
                📦 {storageProvider.toUpperCase()} • Pointer será salvo on-chain
              </div>
              {storagePointer && (
                <div className="text-xs font-mono text-muted-foreground break-all bg-muted/30 p-2 rounded">
                  {storagePointer}
                </div>
              )}
            </div>
            
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Taxa de rede:</div>
                <div className="text-sm font-mono font-semibold">
                  {estimatedFee.toFixed(6)} {selectedNetwork === 'solana' ? 'SOL' : selectedNetwork === 'bitcoin' ? 'BTC' : 'ETH'}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Confirmação em ~{selectedNetwork && NETWORKS[selectedNetwork as NetType].confirmationTime}
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSend} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Confirmar Envio"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
