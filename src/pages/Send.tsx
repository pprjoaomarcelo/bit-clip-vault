import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Lock, Send as SendIcon, DollarSign, Database, Loader2, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { detectNetwork, type NetworkType } from "@/lib/mockData";
import { NetworkBadge } from "@/components/NetworkBadge";
import { Navbar } from "@/components/Navbar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

// Nossos módulos de lógica de backend (ainda como esqueletos)
import { uploadToIpfs } from "@/lib/ipfs";
import { createStorageDeal } from "@/lib/filecoin";
import { createLightningInvoice, getInvoiceStatus } from "@/lib/lightning";

import { NETWORKS, estimateGasFee, L2_NETWORKS, checkNetworkHealth, type NetworkType as NetType } from "@/lib/networks";
import { sendEvmTransaction } from "@/lib/ethereum";
import { supabase } from "@/integrations/supabase/client";

type SendMode = "complete" | "ipfs_only" | "on_chain";

export default function Send() {
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [sendMode, setSendMode] = useState<SendMode>("complete");
  
  const [detectedNetwork, setDetectedNetwork] = useState<NetworkType>("unknown");
  const [selectedNetwork, setSelectedNetwork] = useState<NetType | "unknown" | "">("");
  const [estimatedFee, setEstimatedFee] = useState<number>(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [storagePointer, setStoragePointer] = useState<string>("");

  const ON_CHAIN_BYTE_LIMIT = 75; // Limite seguro para OP_RETURN com prefixo

  useEffect(() => {
    const walletData = sessionStorage.getItem("wallet");
    if (walletData) {
      const data = JSON.parse(walletData);
      setConnected(data.connected || false);
      setAddress(data.address || "");
    }
  }, []);

  // Desabilita a criptografia se o modo for on-chain
  useEffect(() => {
    if (sendMode === 'on_chain') {
      setIsEncrypted(false);
    }
  }, [sendMode]);

  const handleConnect = () => navigate("/connect");

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
      if (network === "ethereum") {
        setSelectedNetwork("arbitrum");
      } else if (network !== "unknown") {
        setSelectedNetwork(network as NetType);
      }
    } else {
      setDetectedNetwork("unknown");
      setSelectedNetwork("");
    }
  };

  const handlePrepareTransaction = async () => {
    if (!recipient.trim() || !message.trim() || !selectedNetwork) {
      toast({ title: "❌ Erro de validação", description: "Preencha todos os campos: destino, mensagem e rede.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
      let payload = ""; // O que será ancorado na blockchain (CID ou mensagem crua)
      
      // Lógica ramificada baseada no modo de envio
      switch (sendMode) {
        case 'on_chain':
          if (new TextEncoder().encode(message).length > ON_CHAIN_BYTE_LIMIT) {
            throw new Error(`A mensagem excede o limite de ${ON_CHAIN_BYTE_LIMIT} bytes para envio on-chain.`);
          }
          console.log("[Send] Modo: On-Chain. Payload é a mensagem crua.");
          payload = message;
          // Aqui chamaríamos a função de transação Bitcoin com o payload
          break;

        case 'ipfs_only':
          console.log("[Send] Modo: IPFS Público. Fazendo upload para o IPFS...");
          // No mundo real, a chave pública do destinatário seria obtida de alguma forma
          payload = await uploadToIpfs(message, isEncrypted ? "mock_recipient_pub_key" : "");
          // Aqui chamaríamos a função de transação Bitcoin com o CID (payload)
          break;

        case 'complete':
          console.log("[Send] Modo: Completo. Iniciando fluxo de pagamento e armazenamento...");
          
          // 1. Criar fatura Lightning
          const invoice = await createLightningInvoice(500, "Taxa de Processamento SovereignComm");
          console.log("[Send] Fatura Lightning criada:", invoice.paymentRequest);
          // Em um app real, mostraríamos um QR code para o usuário pagar
          toast({ title: "Pagamento Necessário", description: `Pague a fatura Lightning para continuar: ${invoice.paymentRequest}` });

          // 2. Simular espera pelo pagamento
          // await new Promise(resolve => setTimeout(resolve, 5000)); // Espera 5s
          // const paymentStatus = await getInvoiceStatus(invoice.paymentHash);
          // if (paymentStatus.status !== 'paid') {
          //   throw new Error("Pagamento da fatura Lightning não foi confirmado a tempo.");
          // }
          console.log("[Send] Pagamento confirmado (simulação).");

          // 3. Fazer upload para IPFS
          payload = await uploadToIpfs(message, isEncrypted ? "mock_recipient_pub_key" : "");

          // 4. (Opcional) Criar contrato no Filecoin para anexos
          // if (message.includes("anexo:")) { // Lógica de detecção de anexo
          //   await createStorageDeal(payload, message.length);
          // }
          break;
      }

      setStoragePointer(payload);
      setShowPreview(true);

    } catch (error) {
      console.error('[Send] Falha na preparação da transação:', error);
      toast({
        title: "❌ Erro na Preparação",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmSend = async () => {
    // A lógica de envio real seria movida para cá, usando o `storagePointer` (payload)
    // e o `sendMode` para decidir qual função de transação chamar (sendBitcoinTransaction, etc.)
    toast({ title: "🚀 Transação Enviada (Simulação)", description: `Payload: ${storagePointer}` });
    setShowPreview(false);
    // Resetar o formulário
    setMessage("");
    setRecipient("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar connected={connected} address={address} onConnect={handleConnect} onDisconnect={handleDisconnect} />

      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><SendIcon className="h-5 w-5" /> Enviar Mensagem</CardTitle>
            <CardDescription>Envie mensagens soberanas com o nível de privacidade e custo que você escolher.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!connected && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Conecte sua carteira para enviar mensagens.
                  <Button onClick={handleConnect} size="sm" className="ml-4">Conectar Carteira</Button>
                </AlertDescription>
              </Alert>
            )}

            {/* SELETOR DE MODO DE ENVIO */}
            <div className="space-y-3">
              <Label>Modo de Envio</Label>
              <RadioGroup value={sendMode} onValueChange={(value: SendMode) => setSendMode(value)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <RadioGroupItem value="complete" id="mode-complete" className="peer sr-only" />
                  <Label htmlFor="mode-complete" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    Seguro e Eficiente
                    <span className="text-xs font-normal text-center mt-1">Criptografado, via IPFS, com custo otimizado. (Recomendado)</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="ipfs_only" id="mode-ipfs" className="peer sr-only" />
                  <Label htmlFor="mode-ipfs" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    Público via IPFS
                    <span className="text-xs font-normal text-center mt-1">Mensagem pública no IPFS, apenas o ponteiro na blockchain.</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="on_chain" id="mode-onchain" className="peer sr-only" />
                  <Label htmlFor="mode-onchain" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    Público On-Chain
                    <span className="text-xs font-normal text-center mt-1">Mensagem pública na blockchain. (Experimental, caro)</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {sendMode === 'on_chain' && (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Atenção: Modo On-Chain</AlertTitle>
                <AlertDescription>
                  Sua mensagem será **pública para sempre** na blockchain, com custo alto e limitada a ~75 caracteres. Use com cuidado.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="recipient">Endereço de destino</Label>
              <Input id="recipient" placeholder="0x... / bc1... / Sol..." value={recipient} onChange={handleRecipientChange} />
              {detectedNetwork !== 'unknown' && <div className="pt-2"><NetworkBadge network={detectedNetwork} /></div>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="message">Mensagem</Label>
                {sendMode === 'on_chain' && (
                  <span className="text-xs text-muted-foreground">{message.length}/{ON_CHAIN_BYTE_LIMIT}</span>
                )}
              </div>
              <Textarea
                id="message"
                placeholder="Digite sua mensagem aqui..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                maxLength={sendMode === 'on_chain' ? ON_CHAIN_BYTE_LIMIT : undefined}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="encryption"
                  checked={isEncrypted}
                  onCheckedChange={setIsEncrypted}
                  disabled={sendMode === 'on_chain'}
                />
                <Label htmlFor="encryption" className={`flex items-center gap-2 ${sendMode === 'on_chain' ? 'text-muted-foreground' : ''}`}>
                  <Lock className="h-4 w-4" />
                  Criptografar mensagem
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {isEncrypted 
                  ? "🔒 Apenas o destinatário poderá ler a mensagem." 
                  : "🌐 A mensagem será pública."}
              </p>
            </div>

            <Button className="w-full" size="lg" onClick={handlePrepareTransaction} disabled={!connected || isProcessing}>
              {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparando...</> : <><SendIcon className="mr-2 h-4 w-4" /> Revisar e Enviar</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showPreview} onOpenChange={setShowPreview}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Envio</AlertDialogTitle>
            <AlertDialogDescription>Revise os detalhes da sua transação antes de confirmar.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <div className="text-sm font-medium">Para:</div>
              <div className="text-sm text-muted-foreground font-mono break-all">{recipient}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">Modo:</div>
              <div className="text-sm text-muted-foreground">{sendMode}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">Payload On-Chain:</div>
              <div className="text-xs text-muted-foreground font-mono break-all bg-muted/30 p-2 rounded">
                {storagePointer}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">Mensagem Original:</div>
              <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto p-2 bg-muted/50 rounded">
                {isEncrypted && sendMode !== 'on_chain' ? "🔒 Criptografada" : message}
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSend} disabled={isProcessing}>
              {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : "Confirmar Envio"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
