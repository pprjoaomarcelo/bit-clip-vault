import express from 'express';
import type { Request, Response } from 'express';
import { create } from 'ipfs-http-client';
import { MerkleTree } from 'merkletreejs';
import SHA256 from 'crypto-js/sha256.js';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';
import axios from 'axios';

// Needed for ECPair in bitcoinjs-lib v6+
const ECPair = ECPairFactory(ecc);

// Create an IPFS client
const ipfs = create({ url: 'https://ipfs.infura.io:5001/api/v0' });

const app = express();
const port = process.env.PORT || 3000;

// Add this line to enable JSON body parsing
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('SovereignComm Gateway is running!');
});

// In-memory store for message CIDs to be batched
const cidBatch: string[] = [];
const BATCH_SIZE = 5;

app.post('/messages', async (req: Request, res: Response) => {
  console.log('Received new message object:', req.body);
  
  const { sender, recipient, timestamp, content, attachments } = req.body;

  // Basic validation for the new schema
  if (!sender || !recipient || !timestamp) {
    return res.status(400).json({ error: 'Sender, recipient, and timestamp are required fields.' });
  }

  try {
    // The entire message object, conforming to our schema, is added to IPFS.
    const { cid } = await ipfs.add(JSON.stringify(req.body));
    console.log('Added message object to IPFS with CID:', cid.toString());

    // Add the new CID to our batch
    cidBatch.push(cid.toString());
    console.log(`CID batch contains ${cidBatch.length} items.`);

    // If batch is full, process it to generate a Merkle Root
    if (cidBatch.length >= BATCH_SIZE) {
      console.log(`BATCH FULL: Processing ${cidBatch.length} CIDs to generate Merkle Root.`);
      
      const leaves = cidBatch.map(cid => SHA256(cid));
      const tree = new MerkleTree(leaves, SHA256);
      const merkleRoot = tree.getRoot().toString('hex');

      console.log('Merkle Tree:', tree.toString());
      console.log('Merkle Root:', merkleRoot);

      await anchorMerkleRoot(merkleRoot);
      
      cidBatch.length = 0;
      console.log('Batch cleared.');
    }

    res.status(201).json({ 
      status: 'Message object processed by gateway', 
      timestamp: new Date().toISOString(),
      message_cid: cid.toString()
    });
  } catch (error) {
    console.error('Error adding to IPFS:', error);
    res.status(500).json({ error: 'Failed to process message object with IPFS.' });
  }
});

async function anchorMerkleRoot(merkleRoot: string) {
  console.log(`--- ANCHORING LOGIC ---`);
  console.log(`Merkle Root to be anchored: ${merkleRoot}`);

  const network = bitcoin.networks.testnet;

  // WARNING: Insecure. For development purposes only.
  const privateKeyWIF = 'cTjW8c3ppd1iT2T4d4g1g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g-';
  const keyPair = ECPair.fromWIF(privateKeyWIF, network);
  const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network });

  if (!address) {
    throw new Error('Could not derive address from WIF.');
  }

  console.log(`Gateway's Testnet Address: ${address}`);

  try {
    // 1. Fetch UTXOs for the address
    const { data: utxos } = await axios.get(`https://blockstream.info/testnet/api/address/${address}/utxo`);

    if (utxos.length === 0) {
      throw new Error(`No UTXOs found for address ${address}. Please fund it on a testnet faucet.`);
    }

    const utxo = utxos[0];
    console.log(`Using UTXO: ${utxo.txid}:${utxo.vout} with value ${utxo.value} satoshis`);

    // 2. Fetch the full transaction hex for the non-witness UTXO
    const { data: txHex } = await axios.get(`https://blockstream.info/testnet/api/tx/${utxo.txid}/hex`);

    // 3. Create the OP_RETURN output
    const data = Buffer.from(merkleRoot, 'hex');
    const embed = bitcoin.payments.embed({ data: [data] });

    // 4. Build the transaction with Psbt
    const psbt = new bitcoin.Psbt({ network });

    // Add input with non-witness UTXO
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      nonWitnessUtxo: Buffer.from(txHex, 'hex'),
    });

    // Add OP_RETURN output
    psbt.addOutput({
      script: embed.output!,
      value: 0n,
    });

    // Add change output
    const fee = 10000; // A fixed fee in satoshis for simplicity
    const changeAmount = utxo.value - fee;
    if (changeAmount < 0) {
      throw new Error('UTXO value is not enough to cover the transaction fee.');
    }
    psbt.addOutput({
      address: address,
      value: BigInt(changeAmount),
    });

    // 5. Sign the transaction
    psbt.signInput(0, keyPair);

    // 6. Finalize and get the transaction hex
    psbt.finalizeAllInputs();
    const finalTxHex = psbt.extractTransaction().toHex();

    console.log('Constructed and Signed Transaction (Hex):');
    console.log(finalTxHex);

    // 7. Broadcast the transaction
    console.log('Broadcasting transaction...');
    const { data: txid } = await axios.post('https://blockstream.info/testnet/api/tx', finalTxHex);
    console.log(`Transaction broadcasted successfully! TXID: ${txid}`);

  } catch (error) {
    console.error('Error anchoring Merkle Root:', error);
  }

  console.log(`--- END ANCHORING LOGIC ---`);
}

app.listen(port, () => {
  console.log(`Gateway server listening on port ${port}`);
});
