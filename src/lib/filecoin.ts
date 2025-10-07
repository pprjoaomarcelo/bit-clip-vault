
/**
 * Este arquivo contém as funções para interagir com a rede Filecoin,
 * permitindo o armazenamento permanente de dados (anexos).
 */

// Tipos de dados para clareza
export interface StorageDeal {
  cid: string;          // O Content ID (CID) do arquivo no IPFS
  dealId: number;       // O ID do contrato na rede Filecoin
  provider: string;     // O endereço do minerador que está armazenando
  status: 'active' | 'expired' | 'slashed';
  duration: number;     // Duração do contrato em dias
  cost: string;         // Custo do contrato em FIL
}

export type FilecoinDealPrice = {
  pricePerGibPerYear: number; // Preço em FIL
  minDealSizeGib: number;     // Tamanho mínimo do contrato em GiB
};

/**
 * Busca os preços atuais do mercado para armazenamento no Filecoin.
 * @returns {Promise<FilecoinDealPrice>} O preço atual e o tamanho mínimo do contrato.
 */
export const getCurrentStoragePrice = async (): Promise<FilecoinDealPrice> => {
  // No futuro, isso faria uma chamada a uma API ou a um oráculo de preços do Filecoin.
  // Por enquanto, retornamos valores mockados realistas baseados em nossa pesquisa.
  console.log('[Filecoin] Buscando preço de armazenamento...');
  return {
    pricePerGibPerYear: 0.00023, // Preço em FIL
    minDealSizeGib: 0.25,       // 256 MiB
  };
};

/**
 * Calcula o custo para armazenar um arquivo no Filecoin por um período.
 * @param fileSizeInBytes - O tamanho do arquivo a ser armazenado.
 * @param durationInDays - A duração do armazenamento.
 * @returns {Promise<number>} O custo estimado em FIL.
 */
export const estimateStorageCost = async (fileSizeInBytes: number, durationInDays: number = 365): Promise<number> => {
  const priceInfo = await getCurrentStoragePrice();
  const fileSizeInGib = fileSizeInBytes / (1024 * 1024 * 1024);
  const durationInYears = durationInDays / 365;

  // Considera o tamanho mínimo do contrato, pois mineradores não aceitam arquivos muito pequenos.
  const effectiveSizeInGib = Math.max(fileSizeInGib, priceInfo.minDealSizeGib);

  const cost = effectiveSizeInGib * priceInfo.pricePerGibPerYear * durationInYears;
  console.log(`[Filecoin] Custo estimado para ${fileSizeInBytes} bytes por ${durationInDays} dias: ${cost.toFixed(8)} FIL`);
  return cost;
};

/**
 * Cria um contrato de armazenamento no Filecoin para um determinado CID.
 * Esta é a função principal que o gateway chamaria.
 * @param cid - O CID do conteúdo já no IPFS.
 * @param fileSizeInBytes - O tamanho do arquivo para cálculo de custo.
 * @param durationInDays - A duração desejada para o contrato.
 * @returns {Promise<StorageDeal>} Os detalhes do contrato criado.
 */
export const createStorageDeal = async (cid: string, fileSizeInBytes: number, durationInDays: number = 365): Promise<StorageDeal> => {
  console.log(`[Filecoin] Iniciando processo de criação de contrato para o CID: ${cid}`);

  // 1. Estimar o custo
  const costInFil = await estimateStorageCost(fileSizeInBytes, durationInDays);

  // 2. Lógica do Gateway (Modelo A): Verificar se a carteira do gateway tem saldo em FIL.
  //    Esta lógica seria complexa, envolvendo APIs de exchange ou swaps.
  //    const gatewayHasEnoughFil = await checkGatewayFilBalance(costInFil);
  //    if (!gatewayHasEnoughFil) {
  //      throw new Error('Saldo de FIL do gateway é insuficiente para criar o contrato.');
  //    }

  // 3. Usar uma biblioteca cliente do Filecoin (ex: @textile/near-storage, ou via FEVM com ethers.js) para propor o contrato.
  //    A implementação real dependeria da biblioteca escolhida.
  console.log(`[Filecoin] Propondo contrato na rede com custo de ${costInFil.toFixed(8)} FIL...`);

  // 4. Mock da resposta da rede para fins de esboço.
  const mockDealId = Math.floor(Math.random() * 100000);
  const mockProvider = "f012345"; // Endereço de um minerador mock

  console.log(`[Filecoin] Contrato ${mockDealId} criado com o provedor ${mockProvider}.`);

  const deal: StorageDeal = {
    cid,
    dealId: mockDealId,
    provider: mockProvider,
    status: 'active',
    duration: durationInDays,
    cost: costInFil.toFixed(8),
  };

  return deal;
};

/**
 * Verifica o status de um contrato de armazenamento existente.
 * Útil para o gateway monitorar se os arquivos dos seus usuários ainda estão seguros.
 * @param dealId - O ID do contrato a ser verificado.
 * @returns {Promise<Pick<StorageDeal, 'status' | 'dealId'>>} O status atualizado do contrato.
 */
export const getDealStatus = async (dealId: number): Promise<Pick<StorageDeal, 'status' | 'dealId'>> => {
  console.log(`[Filecoin] Verificando status do contrato ${dealId}...`);
  // Lógica para consultar a blockchain do Filecoin pelo status do contrato.
  // Retornaria 'active', 'expired', ou 'slashed' (se o minerador falhou na prova).
  return {
    dealId,
    status: 'active', // Mock
  };
};
