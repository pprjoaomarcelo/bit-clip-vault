import { ethers } from "ethers";

// Function to send a transaction on an EVM-compatible network
// containing a pointer to off-chain data (e.g., an IPFS CID).
export const sendEvmTransaction = async (
  storagePointer: string,
  recipient: string
): Promise<string> => {
  // Check if MetaMask or a compatible wallet is installed
  if (typeof window.ethereum === "undefined") {
    throw new Error("Carteira EVM não encontrada. Por favor, instale a MetaMask.");
  }

  try {
    // Create a new provider and get the signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Convert the storage pointer string to hex
    const data = ethers.hexlify(ethers.toUtf8Bytes(storagePointer));

    // Construct the transaction
    const tx = await signer.sendTransaction({
      to: recipient,
      value: 0, // Sending 0 ETH, as we are only transferring data
      data: data,
    });

    // Wait for the transaction to be mined
    const receipt = await tx.wait();

    if (!receipt) {
        throw new Error("Falha ao obter o recibo da transação.");
    }

    // Return the transaction hash
    return receipt.hash;

  } catch (error: any) {
    // Handle common errors
    if (error.code === 'ACTION_REJECTED') {
      throw new Error("Transação rejeitada pelo usuário.");
    }
    if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error("Saldo insuficiente para pagar o gás da transação.");
    }
    // Re-throw other errors
    throw new Error(error.message || "Ocorreu um erro ao enviar a transação EVM.");
  }
};
