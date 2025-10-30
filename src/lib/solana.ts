import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  clusterApiUrl,
} from '@solana/web3.js';

// A interface para uma carteira Solana conectada (padrão do Wallet-Adapter)
// A UI precisará fornecer um objeto que corresponda a esta interface.
export interface SolanaWallet {
  publicKey: PublicKey;
  sendTransaction: (transaction: Transaction, connection: Connection) => Promise<string>;
}

// O ID do programa Memo da Solana, que aceita dados arbitrários
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcVtrp5GhoG22uBwNo9');

/**
 * Envia uma transação na rede Solana contendo um ponteiro de armazenamento (CID)
 * usando o programa Memo.
 * @param storagePointer - O CID do IPFS a ser ancorado na blockchain.
 * @param wallet - O objeto da carteira do remetente que pode assinar e enviar a transação.
 * @returns {Promise<string>} A assinatura da transação.
 */
export const sendSolanaTransaction = async (
  storagePointer: string,
  wallet: SolanaWallet
): Promise<string> => {
  if (!wallet || !wallet.publicKey) {
    throw new Error('Carteira Solana não conectada ou inválida.');
  }

  console.log(`[Solana] Iniciando envio de CID via Memo: ${storagePointer}`);

  try {
    // 1. Conectar à rede de desenvolvimento (devnet) da Solana
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    // 2. Criar a instrução para o programa Memo com nosso CID como dados
    const memoInstruction = new TransactionInstruction({
      keys: [{ pubkey: wallet.publicKey, isSigner: true, isWritable: true }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(storagePointer, 'utf-8'),
    });

    // 3. Criar a transação e adicionar a instrução
    const transaction = new Transaction().add(memoInstruction);

    // 4. Obter o blockhash recente, necessário para a transação
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // 5. Usar o método `sendTransaction` da carteira para pedir ao usuário para assinar e enviar
    const signature = await wallet.sendTransaction(transaction, connection);
    console.log(`[Solana] Transação enviada com sucesso. Assinatura: ${signature}`);

    // 6. (Opcional) Confirmar que a transação foi finalizada pela rede
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight });
    console.log(`[Solana] Transação confirmada.`);

    return signature;

  } catch (error: any) {
    console.error('[Solana] Falha na transação via Memo:', error);
    if (error.name === 'WalletSendTransactionError') {
      throw new Error('Transação rejeitada pelo usuário na carteira.');
    }
    throw new Error(`Falha ao enviar transação na Solana: ${error.message}`);
  }
};