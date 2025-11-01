/**
 * @file index.ts
 * @description The main entry point for the SovereignComm Gateway service, responsible for batching messages and anchoring them on-chain.
 * @description The main entry point for the SovereignComm Gateway service.
 */

import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import { create } from 'ipfs-http-client';
import { MerkleTree } from 'merkletreejs';
import SHA256 from 'crypto-js/sha256.js';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';
import axios from 'axios';

const ECPair = ECPairFactory(ecc);

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

// Check for required environment variables
if (!process.env.PINATA_JWT || !process.env.GATEWAY_BITCOIN_WIF) {
  console.error(
    'Error: PINATA_JWT and GATEWAY_BITCOIN_WIF must be set in the .env file.'
  );
  process.exit(1);
}

// Configure IPFS client to use Pinata
const ipfs = create({
  host: 'api.pinata.cloud',
  port: 443,
  protocol: 'https',
  headers: {
    Authorization: `Bearer ${process.env.PINATA_JWT}`,
  },
});

app.use(express.json());

// In-memory batch of message CIDs
const cidBatch: string[] = [];
const BATCH_SIZE = 5;

/**
 * Health check endpoint.
 */
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ status: 'Gateway is running' });
});

/**
 * Endpoint for clients to submit messages.
 * @route POST /messages
 */
app.post('/messages', async (req: Request, res: Response) => {
  console.log('Received new message:', req.body);

  try {
    // 1. Add the message object to IPFS
    const { cid } = await ipfs.add(JSON.stringify(req.body));
    console.log(`Added message to IPFS. CID: ${cid.toString()}`);

    // 2. Add the CID to the current batch
    cidBatch.push(cid.toString());
    console.log(`Added CID to batch. Current batch size: ${cidBatch.length}`);

    // 3. If batch is full, process it
    if (cidBatch.length >= BATCH_SIZE) {
      console.log('Processing batch...');
      const merkleRoot = await processCidBatch(cidBatch);
      console.log('Batch processed. Merkle Root:', merkleRoot);
      // Clear the batch for the next set of messages
      cidBatch.length = 0;
    }

    res.status(202).json({
      message: 'Message received and is being processed.',
      cid: cid.toString(),
    });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message.' });
  }
});

/**
 * Processes a batch of CIDs, creates a Merkle tree, and anchors the root on-chain.
 * @param cids - An array of IPFS CIDs to process.
 */
async function processCidBatch(cids: string[]): Promise<string> {
  // 1. Create a Merkle tree from the batch of CIDs
  const leaves = cids.map(cid => SHA256(cid));
  const tree = new MerkleTree(leaves, SHA256);
  const merkleRoot = tree.getRoot().toString('hex');
  console.log('Merkle Root:', merkleRoot);

  // 2. Anchor the merkleRoot onto the Bitcoin blockchain.
  try {
    await anchorMerkleRootOnBitcoin(merkleRoot);
  } catch (error) {
    console.error('Failed to process batch. The CIDs in this batch may need to be re-processed.', { cids, error });
    throw error; // Re-throw the error to let the caller know the batch failed.
  }
  await anchorMerkleRoot(merkleRoot);

  return merkleRoot;
}

/**
 * Creates and broadcasts a Bitcoin transaction with an OP_RETURN output.
 * @param data - The data to be embedded in the OP_RETURN (our Merkle Root).
 */
async function anchorMerkleRootOnBitcoin(data: string): Promise<string> {
  console.log(`--- ANCHORING LOGIC ---`);
  console.log(`Merkle Root to be anchored: ${data}`);

  const network = bitcoin.networks.testnet;

  const privateKeyWIF = process.env.GATEWAY_BITCOIN_WIF;
  if (!privateKeyWIF) {
    throw new Error('GATEWAY_BITCOIN_WIF is not set in .env file.');
  }

  const keyPair = ECPair.fromWIF(privateKeyWIF, network);
  const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network });

  if (!address) {
    throw new Error('Could not derive address from WIF.');
  }

  console.log(`Gateway's Testnet Address: ${address}`);

  try {
    // 1. Fetch UTXOs
    const { data: utxos } = await axios.get(
      `https://blockstream.info/testnet/api/address/${address}/utxo`
    );

    if (utxos.length === 0) {
      throw new Error(`No UTXOs found for address ${address}. Please fund it on a testnet faucet.`);
    }

    // A simple strategy: use the largest UTXO
    const utxo = utxos.reduce((prev: any, curr: any) => (prev.value > curr.value) ? prev : curr);
    console.log(`Using UTXO: ${utxo.txid}:${utxo.vout} with value ${utxo.value} satoshis`);

    // Fetch the full transaction hex for the non-witness UTXO
    const { data: txHex } = await axios.get(`https://blockstream.info/testnet/api/tx/${utxo.txid}/hex`);

    // 2. Prepare the transaction
    const psbt = new bitcoin.Psbt({ network });
    const dataBuffer = Buffer.from(data, 'hex');
    const embed = bitcoin.payments.embed({ data: [dataBuffer] });

    psbt.addInput({ hash: utxo.txid, index: utxo.vout, nonWitnessUtxo: Buffer.from(txHex, 'hex') });
    psbt.addOutput({ script: embed.output!, value: 0n });

    const fee = 1000; // A fixed fee in satoshis for simplicity
    const changeAmount = utxo.value - fee;
    if (changeAmount < 546) { // Dust limit
      throw new Error('UTXO value is not enough to cover the transaction fee and avoid dust.');
    }
    psbt.addOutput({ address: address, value: BigInt(changeAmount) });

    psbt.signInput(0, keyPair);
    psbt.finalizeAllInputs();

    const finalTxHex = psbt.extractTransaction().toHex();
    console.log('Constructed and Signed Transaction (Hex):', finalTxHex);

    console.log('Broadcasting transaction...');
    const { data: txid } = await axios.post('https://blockstream.info/testnet/api/tx', finalTxHex);
    console.log(`Transaction broadcasted successfully! TXID: ${txid}`);
    return txid;
  } catch (error) {
    console.error('Error anchoring Merkle Root:', error);
    throw error;
  }
}

app.listen(PORT, () => {
  console.log(`Gateway server listening on port ${PORT}`);
});