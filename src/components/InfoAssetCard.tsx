import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InfoAsset } from "@/lib/marketplaceMock";
import { Bitcoin, Ticket, FileLock, BookOpen } from "lucide-react";

interface InfoAssetCardProps {
  asset: InfoAsset;
}

const typeIcons: Record<InfoAsset['type'], React.ReactNode> = {
  course: <BookOpen className="w-4 h-4" />,
  ticket: <Ticket className="w-4 h-4" />,
  leak: <FileLock className="w-4 h-4" />,
  report: <BookOpen className="w-4 h-4" />,
};

const formatSats = (amount: number) => {
  return new Intl.NumberFormat('en-US').format(amount);
};

export const InfoAssetCard = ({ asset }: InfoAssetCardProps) => {
  const formatAddress = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-6)}`;

  return (
    <Card className="flex flex-col overflow-hidden bg-card/50 backdrop-blur-sm">
      <div className="h-40 w-full overflow-hidden">
        <img
          src={asset.thumbnailUrl}
          alt={asset.title}
          className="h-full w-full object-cover transition-transform hover:scale-105"
        />
      </div>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="capitalize gap-1.5">
            {typeIcons[asset.type]}
            {asset.type}
          </Badge>
        </div>
        <CardTitle className="text-lg leading-tight">{asset.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground mb-4">
          {asset.description}
        </p>
        <div className="flex flex-wrap gap-1">
          {asset.tags.map((tag) => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4 pt-4 border-t border-border/50">
        <div>
          <p className="text-xs text-muted-foreground">Vendedor</p>
          <p className="text-xs font-mono">{formatAddress(asset.sellerAddress)}</p>
        </div>
        <div className="w-full flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-1.5">
            <Bitcoin className="w-4 h-4 text-primary" />
            <span className="text-xl font-bold">{formatSats(asset.priceSats)}</span>
            <span className="text-sm text-muted-foreground">sats</span>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-black">
            Comprar Acesso
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};