import { ethers } from "ethers";
import * as dotenv from 'dotenv';
import MailboxArtifact from "../artifacts/contracts/Mailbox.sol/Mailbox.json";

dotenv.config();

async function main() {
  const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
  const PRIVATE_KEY = process.env.PRIVATE_KEY;

  if (!SEPOLIA_RPC_URL || !PRIVATE_KEY) {
    throw new Error("Por favor, defina SEPOLIA_RPC_URL e PRIVATE_KEY no seu arquivo .env");
  }

  // 1. Configurar o provedor e a carteira
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`Usando a carteira: ${wallet.address}`);

  // 2. Criar uma "fábrica" para o nosso contrato
  // A ContractFactory precisa do ABI (a interface) e do bytecode (o código compilado)
  const MailboxFactory = new ethers.ContractFactory(MailboxArtifact.abi, MailboxArtifact.bytecode, wallet);

  console.log("Implantando o contrato Mailbox...");

  // 3. Implantar o contrato
  const mailbox = await MailboxFactory.deploy();
  
  // Esperar a transação de implantação ser minerada
  await mailbox.waitForDeployment();

  const contractAddress = await mailbox.getAddress();

  console.log(`Contrato Mailbox implantado com sucesso no endereço: ${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
