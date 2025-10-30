#!/usr/bin/env node

import { generateSecretKey, getStacksAddress } from '@stacks/wallet-sdk';
import { StacksTestnet } from '@stacks/network';
import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import fs from 'fs/promises';
import path from 'path';

const ECPair = ECPairFactory(ecc);

/**
 * This script generates a new Stacks private key and creates a .env file
 * for the gateway service with the necessary variables for local testing.
 */
async function main() {
  console.log('🔑 Generating new Stacks testnet key...');

  // 1. Generate a new Stacks private key
  const secretKey = generateSecretKey();
  const network = new StacksTestnet();

  // 2. Derive the corresponding Stacks address for testnet
  const address = getStacksAddress({
    secretKey,
    network,
  });

  console.log(`\nGenerated Stacks Private Key:`);
  console.log(secretKey);
  console.log(`\nCorresponding Testnet Address:`);
  console.log(address);

  console.log('\n🔑 Generating new Bitcoin testnet key...');
  const btcNetwork = bitcoin.networks.testnet;
  const keyPair = ECPair.makeRandom({ network: btcNetwork });
  const btcWif = keyPair.toWIF();
  const { address: btcAddress } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: btcNetwork });

  console.log(`\nGenerated Bitcoin WIF:`);
  console.log(btcWif);
  console.log(`\nCorresponding Testnet Address:`);
  console.log(btcAddress);

  // 3. Prepare the .env content
  const envContent = [
    `# Stacks-related variables for the gateway`,
    `GATEWAY_STACKS_PRIVATE_KEY="${secretKey}"`,
    `# TODO: Replace with your deployed contract address on testnet`,
    `STACKS_CONTRACT_ADDRESS="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"`,
    `STACKS_CONTRACT_NAME="sbtc-anchor"`,
    ``,
    `# Bitcoin-related variables for the gateway (legacy OP_RETURN)`,
    `GATEWAY_BITCOIN_WIF="${btcWif}"`,
    ``,
    `# TODO: Replace with your Pinata JWT for IPFS uploads`,
    `PINATA_JWT=""`,
  ].join('\n');

  // 4. Write the .env file in the gateway directory
  const envPath = path.resolve(process.cwd(), 'gateway', '.env');
  await fs.writeFile(envPath, envContent);

  console.log(`\n✅ Successfully created .env file at: ${envPath}`);
  console.log('Please update PINATA_JWT and STACKS_CONTRACT_ADDRESS with your actual values.');
}

main().catch(console.error);