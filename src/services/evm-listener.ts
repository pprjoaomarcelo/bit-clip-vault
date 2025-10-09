import { ethers } from 'ethers';
import { supabase } from '../integrations/supabase/client'; // Ajuste o caminho se necessário
import { NETWORKS } from '../lib/networks';

// Usaremos a rede Arbitrum como nosso alvo inicial para o listener
const TARGET_NETWORK = NETWORKS.arbitrum;
const RPC_URL = TARGET_NETWORK.rpcUrl;

if (!RPC_URL) {
  throw new Error(`RPC URL para a rede ${TARGET_NETWORK.name} não foi encontrada.`);
}

// 1. Configurar o Provedor Ethers
// Usamos JsonRpcProvider para nos conectarmos a um nó EVM diretamente via URL
const provider = new ethers.JsonRpcProvider(RPC_URL);

console.log(`[EVM Listener] Conectado ao provedor da rede ${TARGET_NETWORK.name}.`);

async function processTransaction(txHash: string) {
  console.log(`[EVM Listener] Processando transação: ${txHash}`);
  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx || !tx.to) {
      // Não é uma transação padrão ou não tem destinatário, ignorar.
      return;
    }

    // Idealmente, buscaríamos todos os endereços de usuários do nosso app no Supabase.
    // Por enquanto, vamos usar um endereço de teste para validar.
    const { data: users, error: userError } = await supabase.from('users').select('address');
    if (userError) {
      console.error('[EVM Listener] Erro ao buscar usuários:', userError);
      return;
    }
    const userAddresses = users.map(u => u.address.toLowerCase());

    if (userAddresses.includes(tx.to.toLowerCase())) {
      console.log(`[EVM Listener] Transação encontrada para um usuário monitorado: ${tx.to}`);

      // 2. Decodificar o CID do campo 'data'
      const cid = ethers.toUtf8String(tx.data);

      if (cid.startsWith('Qm') || cid.startsWith('bafy')) {
        console.log(`[EVM Listener] CID decodificado: ${cid}`);

        // 3. Salvar no Supabase
        const { error } = await supabase.from('messages').insert({
          sender: tx.from,
          recipient: tx.to,
          cid: cid,
          tx_hash: tx.hash,
          network: TARGET_NETWORK.id,
          content: '', // O conteúdo será buscado do IPFS pelo cliente
        });

        if (error) {
          console.error('[EVM Listener] Erro ao inserir no Supabase:', error);
        } else {
          console.log('[EVM Listener] Mensagem inserida no Supabase com sucesso!');
        }
      } else {
        console.log(`[EVM Listener] O payload da transação não parece ser um CID válido: ${cid}`);
      }
    }
  } catch (error) {
    console.error(`[EVM Listener] Falha ao processar a transação ${txHash}:`, error);
  }
}

async function main() {
  console.log('[EVM Listener] Iniciando o monitoramento de novos blocos...');

  provider.on('block', async (blockNumber) => {
    console.log(`[EVM Listener] Novo bloco detectado: ${blockNumber}`);
    try {
      const block = await provider.getBlock(blockNumber);
      if (block && block.transactions) {
        for (const txHash of block.transactions) {
          // Processar sem esperar a conclusão para não bloquear o loop do bloco
          processTransaction(txHash);
        }
      }
    } catch (error) {
      console.error(`[EVM Listener] Erro ao processar o bloco ${blockNumber}:`, error);
    }
  });
}

main().catch((error) => {
  console.error('[EVM Listener] Erro fatal no serviço de listener:', error);
  process.exit(1);
});
