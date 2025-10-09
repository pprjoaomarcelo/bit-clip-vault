
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from 'https://esm.sh/ethers@6.7.0'

// ATENÇÃO: Substitua pela sua URL de RPC de um provedor como Infura ou Alchemy
const L2_RPC_URL = Deno.env.get("L2_RPC_URL") || "https://sepolia-rollup.arbitrum.io/rpc";

// Função para decodificar o CID do campo de dados da transação
const decodeCidFromData = (data: string): string | null => {
  try {
    // O CID está codificado em UTF-8 e depois em hexadecimal
    const decodedString = ethers.toUtf8String(data);
    // Um CID do IPFS v2 geralmente começa com 'bafy' ou similar e tem um certo comprimento
    if (decodedString.startsWith('Qm') || decodedString.startsWith('bafy')) {
      return decodedString;
    }
    return null;
  } catch (e) {
    return null; // Não é um CID em formato de string UTF-8
  }
}

// Função principal que é executada quando a Edge Function é chamada
serve(async (req) => {
  try {
    // 1. Inicializar clientes
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const provider = new ethers.JsonRpcProvider(L2_RPC_URL);

    // 2. Obter o último bloco verificado do nosso banco de dados
    const { data: lastBlockData, error: lastBlockError } = await supabaseClient
      .from('indexer_state')
      .select('last_checked_block')
      .single();

    if (lastBlockError && lastBlockError.code !== 'PGRST116') { // PGRST116 = a tabela está vazia
      throw lastBlockError;
    }

    const fromBlock = lastBlockData ? lastBlockData.last_checked_block + 1 : await provider.getBlockNumber() - 10; // Se for a primeira vez, verifica os últimos 10 blocos
    const toBlock = await provider.getBlockNumber();

    if (fromBlock > toBlock) {
      return new Response(JSON.stringify({ message: "Nenhum bloco novo para verificar." }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    console.log(`Verificando blocos de ${fromBlock} a ${toBlock}...`);

    // 3. Iterar sobre os blocos e transações
    let messagesFound = 0;
    for (let i = fromBlock; i <= toBlock; i++) {
      const block = await provider.getBlock(i, true); // O segundo parâmetro `true` pré-busca as transações
      if (!block) continue;

      for (const tx of block.prefetchedTransactions) {
        if (tx.data && tx.data !== '0x') {
          const cid = decodeCidFromData(tx.data);
          if (cid) {
            console.log(`CID encontrado: ${cid} na transação ${tx.hash}`);
            messagesFound++;
            
            // 4. Buscar conteúdo no IPFS (Simulação)
            // Em um cenário real, faríamos uma chamada a um gateway IPFS: `https://ipfs.io/ipfs/${cid}`
            const messageContent = `Conteúdo simulado para o CID: ${cid}`;

            // 5. Salvar a mensagem no Supabase
            const { error: insertError } = await supabaseClient.from('messages').insert({
              recipient: tx.to, // O destinatário da transação é o destinatário da mensagem
              sender: tx.from,
              content: messageContent, // Em um cenário real, o conteúdo estaria criptografado
              tx_hash: tx.hash,
              cid: cid,
              network: 'arbitrum_sepolia' // Exemplo
            });

            if (insertError) {
              console.error("Erro ao inserir mensagem no Supabase:", insertError);
            } else {
              console.log(`Mensagem para ${tx.to} salva com sucesso.`);
            }
          }
        }
      }
    }

    // 6. Atualizar o último bloco verificado no banco de dados
    const { error: updateError } = await supabaseClient
      .from('indexer_state')
      .upsert({ id: 1, last_checked_block: toBlock });

    if (updateError) {
      throw updateError;
    }

    const responseMessage = `Verificação completa. ${messagesFound} novas mensagens encontradas.`;
    return new Response(JSON.stringify({ message: responseMessage }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erro na função do indexador:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
})
