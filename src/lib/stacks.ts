import { openContractCall } from '@stacks/connect';
import { StacksTestnet } from '@stacks/network';
import { bufferCV, standardPrincipalCV, ClarityType, callReadOnlyFunction } from '@stacks/transactions';
import { toast } from '@/hooks/use-toast';

// TODO: Substituir pelo endereço e nome do contrato real após o deploy.
const IDENTITY_CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Endereço de exemplo
const IDENTITY_CONTRACT_NAME = 'identity-contract';

/**
 * Pede ao usuário para assinar e transmitir uma transação que registra sua chave pública de criptografia.
 * @param publicKey - A chave pública de criptografia do usuário como um Buffer.
 * @param userAddress - O endereço Stacks do usuário para a rede.
 */
export async function registerPublicKeyOnStacks(publicKey: Buffer, userAddress: string) {
  const options = {
    contractAddress: IDENTITY_CONTRACT_ADDRESS,
    contractName: IDENTITY_CONTRACT_NAME,
    functionName: 'register-public-key',
    functionArgs: [
      // Converte o Buffer da chave para o formato que o Clarity entende (buffer)
      bufferCV(publicKey),
    ],
    network: new StacksTestnet(), // Usaremos a Testnet para desenvolvimento
    appDetails: {
      name: 'SovereignComm',
      icon: window.location.origin + '/logo.png', // Ícone do nosso app
    },
    onFinish: (data: any) => {
      console.log('Transação de registro enviada! TxID:', data.txId);
      toast({
        title: "✅ Chave Pública Registrada!",
        description: `Sua chave foi registrada na blockchain da Stacks. TxID: ${data.txId}`,
      });
    },
    onCancel: () => {
      console.log('Usuário cancelou o registro da chave.');
      toast({
        title: "Registro Cancelado",
        description: "A operação foi cancelada pelo usuário.",
        variant: "destructive",
      });
    },
  };

  // Abre o pop-up da carteira para o usuário confirmar
  await openContractCall(options);
}

/**
 * Consulta a blockchain da Stacks para obter a chave pública de criptografia de um usuário.
 * @param userAddress - O endereço Stacks do usuário (ex: 'ST123...').
 * @returns A chave pública como um Buffer, ou null se não for encontrada.
 */
export async function getPublicKeyFromStacks(userAddress: string): Promise<Buffer | null> {
  console.log(`[Stacks] Buscando chave pública para o endereço: ${userAddress}`);
  const options = {
    contractAddress: IDENTITY_CONTRACT_ADDRESS,
    contractName: IDENTITY_CONTRACT_NAME,
    functionName: 'get-public-key',
    functionArgs: [
      // Converte o endereço string para o formato que o Clarity entende (principal)
      standardPrincipalCV(userAddress),
    ],
    network: new StacksTestnet(),
    senderAddress: userAddress, // Pode ser qualquer endereço, já que é uma chamada de leitura
  };

  try {
    const result = await callReadOnlyFunction(options);

    if (result.type === ClarityType.OptionalSome && result.value.type === ClarityType.Buffer) {
      return Buffer.from(result.value.buffer);
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao buscar chave pública na Stacks:", error);
    toast({ title: "Erro de Consulta", description: "Não foi possível buscar a chave pública na rede Stacks.", variant: "destructive" });
    return null;
  }
}