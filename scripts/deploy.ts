import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  console.log("Buscando a fábrica de contratos para Mailbox...");
  const MailboxFactory = await ethers.getContractFactory("Mailbox");

  console.log("Implantando o contrato Mailbox...");
  
  // Hardhat usa a primeira chave privada da lista 'accounts' na configuração da rede
  // para implantar o contrato.
  const mailbox = await MailboxFactory.deploy();

  await mailbox.waitForDeployment();

  const contractAddress = await mailbox.getAddress();

  console.log(`Contrato Mailbox implantado com sucesso no endereço: ${contractAddress}`);
  console.log(`Rede: ${ethers.provider.network.name}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
