import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import ECPairFactory from 'ecpair';
import axios from 'axios';

const ECPair = ECPairFactory(ecc);

const network = bitcoin.networks.testnet;
const BITCOIN_API_URL = 'https://blockstream.info/testnet/api';

/**
 * Retrieves the gateway's Bitcoin testnet wallet details.
 * @throws {Error} If the WIF is not configured.
 * @returns The key pair and address.
 */
function getWallet() {
  const privateKeyWIF = process.env.GATEWAY_BITCOIN_WIF;
  if (!privateKeyWIF) {
    throw new Error('GATEWAY_BITCOIN_WIF is not set in the .env file.');
  }
  const keyPair = ECPair.fromWIF(privateKeyWIF, network);
  const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network });

  if (!address) {
    throw new Error('Could not derive address from WIF.');
  }

  return { keyPair, address };
}

/**
 * Fetches the largest spendable UTXO for a given address.
 * @param address The Bitcoin address to check.
 * @returns The largest unspent transaction output.
 * @throws {Error} If no UTXOs are found.
 */
async function getLargestUtxo(address: string) {
  const { data: utxos } = await axios.get(`${BITCOIN_API_URL}/address/${address}/utxo`);
  if (!utxos || utxos.length === 0) {
    throw new Error(`No UTXOs found for address ${address}. Please fund it on a testnet faucet.`);
  }
  // Return the largest UTXO to maximize chance of covering fees
  return utxos.reduce((prev: any, curr: any) => (prev.value > curr.value ? prev : curr));
}

/**
 * Fetches the full transaction hex for a given transaction ID.
 * This is required for the non-witness UTXO.
 * @param txid The transaction ID.
 * @returns The transaction hex.
 */
async function getTxHex(txid: string): Promise<string> {
  const { data } = await axios.get(`${BITCOIN_API_URL}/tx/${txid}/hex`);
  return data;
}

/**
 * Anchors a Merkle Root onto the Bitcoin testnet blockchain using an OP_RETURN transaction.
 * @param merkleRoot The hex-encoded Merkle Root to anchor.
 * @returns The transaction ID of the broadcasted transaction.
 * @throws {Error} If any step of the process fails.
 */
export async function anchorMerkleRoot(merkleRoot: string): Promise<string> {
  console.log(`--- ANCHORING LOGIC ---`);
  console.log(`Merkle Root to be anchored: ${merkleRoot}`);

  const { keyPair, address } = getWallet();
  console.log(`Gateway's Testnet Address: ${address}`);

  try {
    // 1. Fetch UTXOs
    const utxo = await getLargestUtxo(address);
    console.log(`Using UTXO: ${utxo.txid}:${utxo.vout} with value ${utxo.value} satoshis`);

    // 2. Fetch the non-witness UTXO (full transaction hex)
    const txHex = await getTxHex(utxo.txid);

    // 3. Create the OP_RETURN output
    const data = Buffer.from(merkleRoot, 'hex');
    const embed = bitcoin.payments.embed({ data: [data] });

    if (!embed.output) {
      throw new Error('Could not create OP_RETURN script.');
    }

    // 4. Build the transaction
    const psbt = new bitcoin.Psbt({ network });

    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      nonWitnessUtxo: Buffer.from(txHex, 'hex'),
    });

    psbt.addOutput({
      script: embed.output,
      value: 0n,
    });

    // 5. Add change output
    const fee = 10000; // A fixed fee in satoshis for simplicity
    const changeAmount = utxo.value - fee;
    if (changeAmount < 0) {
      throw new Error('UTXO value is not enough to cover the transaction fee.');
    }
    psbt.addOutput({
      address: address,
      value: BigInt(changeAmount),
    });

    // 6. Sign and finalize
    psbt.signInput(0, keyPair);
    psbt.finalizeAllInputs();
    const finalTxHex = psbt.extractTransaction().toHex();
    console.log('Constructed and Signed Transaction (Hex):', finalTxHex);

    // 7. Broadcast the transaction
    console.log('Broadcasting transaction...');
    const { data: txid } = await axios.post(`${BITCOIN_API_URL}/tx`, finalTxHex);
    console.log(`Transaction broadcasted successfully! TXID: ${txid}`);
    console.log(`--- END ANCHORING LOGIC ---`);
    return txid;
  } catch (error) {
    console.error('Error in anchorMerkleRoot:', error);
    throw new Error('Failed to anchor Merkle Root on Bitcoin blockchain.');
  }
}