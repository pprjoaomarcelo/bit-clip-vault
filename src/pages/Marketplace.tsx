import { Navbar } from "@/components/Navbar";
import { InfoAssetCard } from "@/components/InfoAssetCard";
import { mockInfoAssets } from "@/lib/marketplaceMock";
import { ShoppingCart } from "lucide-react";

export default function Marketplace() {
  // No futuro, aqui teríamos a lógica para conectar à carteira
  // e buscar os dados de um contrato ou API descentralizada.

  return (
    <div className="min-h-screen bg-background">
      <Navbar connected={false} address="" onConnect={() => {}} onDisconnect={() => {}} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-primary" />
            Mercado de Informação
          </h1>
          <p className="text-muted-foreground">Compre e venda o acesso a informações como um ativo soberano.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockInfoAssets.map((asset) => <InfoAssetCard key={asset.id} asset={asset} />)}
        </div>
      </div>
    </div>
  );
}