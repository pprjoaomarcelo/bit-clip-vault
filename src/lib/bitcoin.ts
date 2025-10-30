import axios from 'axios';
/**
 * Represents the result of an anchoring transaction on the Bitcoin blockchain.
 */
export interface BitcoinAnchorResult {
  txId: string;
  merkleRoot: string;
}

/**
 * Sends a message payload (like a CID) to our local gateway to be anchored
 * on the Bitcoin testnet.
 *
 * @param payload The data to be anchored. Usually an IPFS CID.
 * @returns A promise that resolves with the transaction result.
 */
export const anchorCidOnBitcoin = async (payload: string): Promise<BitcoinAnchorResult> => {
  console.log(`[Bitcoin] Sending payload to gateway for anchoring: ${payload}`);

  if (!payload) {
    throw new Error("Payload for anchoring cannot be empty.");
  }

  // O gateway agora é responsável por toda a lógica complexa do Bitcoin.
  // O cliente (frontend) apenas envia a mensagem para o gateway.
  // O gateway está rodando na porta 3000.
  const gatewayUrl = 'http://localhost:3000/messages';

  try {
    // O corpo da requisição simula uma mensagem completa,
    // onde o 'content' é o nosso CID.
    const response = await axios.post(gatewayUrl, {
      sender: 'frontend-client',
      recipient: 'bitcoin-anchor',
      timestamp: new Date().toISOString(),
      content: payload, // O CID é o conteúdo da mensagem para o gateway
      attachments: [],
    });

    console.log('[Bitcoin] Gateway response:', response.data);

    // O gateway deve retornar o txId e a merkleRoot após o processamento.
    return response.data;
  } catch (error: any) {
    console.error('[Bitcoin] Error sending payload to gateway:', error.response?.data || error.message);
    throw new Error('Failed to send payload to the gateway for Bitcoin anchoring.');
  }
};