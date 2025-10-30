export interface InfoAsset {
  id: string;
  type: 'course' | 'ticket' | 'leak' | 'report';
  title: string;
  description: string;
  sellerAddress: string;
  priceSats: number;
  thumbnailUrl: string;
  tags: string[];
}

export const mockInfoAssets: InfoAsset[] = [
  {
    id: '1',
    type: 'course',
    title: 'Curso Completo de Criptografia Pós-Quântica',
    description: 'Aprenda os fundamentos da criptografia que resistirá aos computadores quânticos. Inclui 10 módulos e certificado NFT.',
    sellerAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    priceSats: 150000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=1932',
    tags: ['educação', 'criptografia', 'segurança'],
  },
  {
    id: '2',
    type: 'ticket',
    title: 'Ingresso VIP - Show da Banda "The Cypherpunks"',
    description: 'Acesso exclusivo ao backstage e open bar. O NFT é o seu ingresso, transferível até 24h antes do evento.',
    sellerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbE',
    priceSats: 75000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=2070',
    tags: ['evento', 'música', 'show'],
  },
  {
    id: '3',
    type: 'leak',
    title: 'Documentos Internos - Projeto "Panopticon"',
    description: 'Análise de 50 páginas sobre a arquitetura do sistema de vigilância global. Acesso via NFT.',
    sellerAddress: '8FXq3KjPPgXyZxQ9X3bN5J9vM2pW4kL7sT5hN9gR6vY2',
    priceSats: 500000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1550537612-96df5005f18b?q=80&w=1936',
    tags: ['vazamento', 'privacidade', 'investigação'],
  },
];