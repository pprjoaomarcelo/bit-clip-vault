import { ethers } from "ethers";

// Função para enviar uma transação EVM contendo um CID (ou qualquer dado)
export async function sendEvmTransaction(cid: string, recipient: string): Promise<string> {
  // 1. Verificar se o provedor de carteira (MetaMask, etc.) está disponível
  if (typeof window.ethereum === 'undefined') {
    throw new Error("Carteira Ethereum não detectada. Instale o MetaMask ou outra carteira compatível.");
  }

  try {
    // 2. Criar um provedor Ethers a partir do provedor da janela (window.ethereum)
    // O BrowserProvider é a maneira recomendada de interagir com carteiras de navegador com ethers v6
    const provider = new ethers.BrowserProvider(window.ethereum);

    // 3. Solicitar ao usuário para conectar sua carteira e obter o signatário
    // Isso vai abrir a pop-up do MetaMask pedindo para o usuário selecionar uma conta
    const signer = await provider.getSigner();
    const senderAddress = await signer.getAddress();
    console.log(`[EVM] Signer obtido. Endereço: ${senderAddress}`);

    // 4. Converter o CID (string) para bytes e depois para um formato hexadecimal
    // Este será o payload de dados da nossa transação
    const dataPayload = ethers.toUtf8Bytes(cid);
    const hexData = ethers.hexlify(dataPayload);
    console.log(`[EVM] Payload do CID convertido para hexadecimal: ${hexData}`);

    // 5. Montar o objeto da transação
    const tx = {
      to: recipient,
      // value: ethers.parseEther("0.0"), // Não estamos enviando ETH, apenas dados
      data: hexData,
    };

    console.log("[EVM] Enviando transação...", tx);

    // 6. Enviar a transação e aguardar a confirmação
    const transactionResponse = await signer.sendTransaction(tx);
    const receipt = await transactionResponse.wait(); // Espera a transação ser minerada

    // 7. Verificar se a transação foi bem-sucedida
    if (receipt === null || receipt.status === 0) {
        throw new Error("A transação falhou. Verifique o recibo para mais detalhes.");
    }
    
    console.log(`[EVM] Transação minerada com sucesso! Hash: ${receipt.hash}`);

    // 8. Retornar o hash da transação
    return receipt.hash;

  } catch (error: any) {
    console.error("[EVM] Erro ao enviar transação:", error);
    // Tratar erros comuns, como rejeição do usuário
    if (error.code === 'ACTION_REJECTED') {
      throw new Error("Transação rejeitada pelo usuário na carteira.");
    }
    throw new Error(`Falha ao enviar transação EVM: ${error.message}`);
  }
}