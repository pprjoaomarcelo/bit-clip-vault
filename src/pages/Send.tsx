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
import QRCode from "qrcode.react";

// Nossos módulos de lógica de backend (ainda como esqueletos)
import { uploadToIpfs } from "@/lib/ipfs";
import { createStorageDeal } from "@/lib/filecoin";
import { anchorCidOnBitcoin } from "@/lib/bitcoin";
import { createLightningInvoice, getInvoiceStatus } from "@/lib/lightning";

import { NETWORKS, estimateGasFee, L2_NETWORKS, checkNetworkHealth, type NetworkType as NetType } from "@/lib/networks";
import { sendEvmTransaction } from "@/lib/ethereum";
import { supabase } from "@/integrations/supabase/client";

type SendMode = "complete" | "ipfs_only" | "on_chain";

type QuoteData = {
  fee_sats: number;
  stress_level: number;
  invoice: string;
  invoice_hash: string;
};

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
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);

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

  const estimateOnChainFee = async () => {
    if (sendMode !== 'on_chain') {
      setEstimatedFee(0);
      return;
    }
    try {
      // Fetch recommended fee rates from a public API
      const feeResponse = await fetch('https://mempool.space/api/v1/fees/recommended');
      const feeRates = await feeResponse.json();
      const fastFee = feeRates.fastestFee; // sats/vB

      // Estimate transaction size (vB) for a simple OP_RETURN tx
      // 1 P2TR input, 1 OP_RETURN output, 1 P2TR change output
      const txSizeVb = 57.5 + 43 + 10.5 + (1 + message.length); 
      const fee = Math.ceil(txSizeVb * fastFee);
      setEstimatedFee(fee);
    } catch (error) {
      console.error("Failed to estimate on-chain fee:", error);
      setEstimatedFee(0); // Reset on error
    }
  };

  // 1. Valida o formulário e abre o pop-up de confirmação
  const handlePreview = async () => {
    if (!recipient.trim() || !message.trim()) {
      toast({ title: "❌ Erro de validação", description: "Preencha o destinatário e a mensagem.", variant: "destructive" });
      return;
    }

    // Se for on-chain, o preview é mais simples, não chama o gateway
    if (sendMode === 'on_chain') {
      await estimateOnChainFee(); // Re-calcula a taxa final
      setQuoteData(null);
      setShowPreview(true);
      return;
    }

    setIsProcessing(true);
    try {
      // Simula o tamanho da mensagem para a cotação
      const estimatedSize = new TextEncoder().encode(JSON.stringify({
        sender: address,
        recipient: recipient,
        timestamp: new Date().toISOString(),
        message: message,
        encrypted: isEncrypted,
      })).length;

      const response = await fetch('http://localhost:3000/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageSizeBytes: estimatedSize }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Falha ao obter cotação do gateway.');
      }

      setQuoteData(result);
      setEstimatedFee(result.fee_sats); // Atualiza o estado com a taxa real do gateway
      setShowPreview(true);
    } catch (error) {
      console.error('[Send] Falha ao obter cotação:', error);
      toast({
        title: "❌ Erro de Cotação",
        description: error instanceof Error ? error.message : "Não foi possível obter uma cotação do gateway.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Envia a mensagem para o gateway APÓS a confirmação no pop-up
  const handleSendMessage = async () => {
    if (!address) {
      toast({ title: "❌ Erro de Conexão", description: "Conecte uma carteira para definir o remetente.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
      switch (sendMode) {
        case 'on_chain':
          // A lógica para 'on_chain' permanece, pois ela chama o gateway diretamente com a mensagem bruta.
          console.log("[Send] Ancorando mensagem on-chain diretamente...");
          const anchorResult = await anchorCidOnBitcoin(message);
          console.log("[Send] Ancoragem no Bitcoin concluída:", anchorResult);
          toast({ title: "✅ Mensagem Ancorada!", description: `Sua mensagem foi ancorada na blockchain do Bitcoin. TxID: ${anchorResult.txId}` });
          break;

        case 'ipfs_only': {
          // Esta lógica será unificada com o modo 'complete' por enquanto,
          // pois ambos agora enviam um CID para o gateway.
          // A diferenciação pode ser feita no futuro no próprio gateway.
          // Por simplicidade, vamos tratá-lo como o modo 'complete'.
          // Fall-through intencional para o caso 'complete'.
        }

        case 'complete': {
          console.log(`[Send] Enviando em Modo Soberano (${sendMode})...`);
          // 1. Preparar o conteúdo completo da mensagem para o IPFS
          const messageContent = {
            sender: address,
            recipient: recipient,
            timestamp: new Date().toISOString(),
            content: message,
            attachments: [], // TODO: Adicionar lógica de anexos aqui
            encrypted: isEncrypted,
          };

          // 2. Fazer o upload para o IPFS (com criptografia, se selecionado)
          const cid = await uploadToIpfs(JSON.stringify(messageContent), recipient, isEncrypted);
          console.log(`[Send] Conteúdo enviado para o IPFS. CID: ${cid}`);

          // 3. Enviar o CID para o gateway usando nossa função centralizada
          const anchorResult = await anchorCidOnBitcoin(cid);
          toast({ title: "🚀 Mensagem Processada pelo Gateway!", description: `CID: ${cid} | Merkle Root: ${anchorResult.merkleRoot}` });

          // 4. Salvar no banco de dados com os dados retornados pelo gateway
          await supabase.from('messages').insert({
            sender_address: address,
            recipient_address: recipient,
            content_cid: cid,
            encrypted: isEncrypted,
            network: 'bitcoin',
            tx_hash: anchorResult.txId,
          });
          break;
        }

        default:
          throw new Error("Modo de envio desconhecido.");
      }

      // Limpa o formulário e fecha o pop-up em caso de sucesso para qualquer modo
      setShowPreview(false);
      setMessage("");
      setRecipient("");
      setQuoteData(null);

    } catch (error) {
      console.error('[Send] Falha ao enviar mensagem:', error);
      toast({
        title: "❌ Erro no Envio",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
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

            {estimatedFee > 0 && (
              <Card className="bg-card/50 border-primary/20">
                <CardContent className="pt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Taxa estimada do Gateway</span>
                    </div>
                    <span className="text-sm font-mono font-semibold">{estimatedFee} sats</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Este é o custo para o gateway processar e ancorar sua mensagem.</div>
                </CardContent>
              </Card>
            )}

            <Button className="w-full" size="lg" onClick={handlePreview} disabled={!connected || isProcessing}>
              {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</> : <><SendIcon className="mr-2 h-4 w-4" /> Revisar Envio</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showPreview} onOpenChange={setShowPreview}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Envio</AlertDialogTitle>
          </AlertDialogHeader>
          {quoteData && sendMode !== 'on_chain' ? (
            <div className="space-y-4 py-4 text-center">
              <p className="text-sm text-muted-foreground">
                Para enviar sua mensagem, pague a fatura Lightning abaixo.
              </p>
              <div className="p-4 bg-card rounded-lg inline-block">
                <QRCode value={quoteData.invoice.toUpperCase()} size={200} />
              </div>
              <div className="font-mono text-lg font-semibold">
                {quoteData.fee_sats} sats
              </div>
              <Alert>
                <DollarSign className="h-4 w-4" />
                <AlertTitle>Aguardando Pagamento</AlertTitle>
                <AlertDescription>
                  Após pagar a fatura, clique em "Confirmar Envio" para que o gateway processe sua mensagem.
                  (Para testes, você pode clicar diretamente).
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="py-4 text-sm">
              <p>Você está prestes a enviar uma mensagem diretamente para a blockchain do Bitcoin.</p>
              <p className="mt-2">Destinatário: <span className="font-mono text-xs">{recipient}</span></p>
              <p className="mt-2">Custo estimado: <span className="font-mono font-semibold">{estimatedFee} sats</span></p>
              {/* Adicionar mais detalhes da transação aqui se necessário */}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing} onClick={() => { setShowPreview(false); setQuoteData(null); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendMessage} disabled={isProcessing}>
              {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : "Confirmar Envio"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
