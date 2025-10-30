
// Este arquivo orquestra o processo de preparação e upload de dados para o IPFS.
import axios from 'axios';
// pako é uma biblioteca de compressão/descompressão Gzip muito popular e eficiente.
import { gzip } from 'pako';
import { encrypt } from 'ecies-js';

/**
 * Comprime os dados usando Gzip.
 * @param data - A string ou buffer de dados a ser comprimido.
 * @returns O buffer de dados comprimidos.
 */
const compressData = (data: string | Uint8Array): Uint8Array => {
  console.log('[IPFS] Comprimindo dados...');
  try {
    const compressed = gzip(data);
    console.log(`[IPFS] Tamanho original: ${data.length} bytes, Comprimido: ${compressed.length} bytes`);
    return compressed;
  } catch (error) {
    console.error('[IPFS] Falha na compressão:', error);
    throw error;
  }
};

/**
 * Criptografa os dados usando a chave pública do destinatário.
 * Esta é a implementação real usando ECIES.
 * @param data - O buffer de dados (já comprimido) a ser criptografado.
 * @param recipientPublicKey - A chave pública do destinatário em formato hexadecimal.
 * @returns O buffer de dados criptografados.
 */
const encryptData = async (data: Uint8Array, recipientPublicKey: string): Promise<Uint8Array> => {
  console.log(`[IPFS] Criptografando dados para a chave pública: ${recipientPublicKey.substring(0, 10)}...`);

  // 1. Converte a chave pública hexadecimal para um Buffer.
  // A biblioteca 'ecies-js' espera um Buffer.
  const publicKeyBuffer = Buffer.from(recipientPublicKey, 'hex');

  // 2. Criptografa os dados usando a chave pública.
  const encrypted = await encrypt(publicKeyBuffer, data);

  console.log(`[IPFS] Dados criptografados (simulação). Tamanho final: ${encrypted.length} bytes`);
  return encrypted;
};

/**
 * Faz o upload de dados para o IPFS, seguindo o fluxo completo:
 * 1. Comprime os dados.
 * 2. Criptografa os dados comprimidos.
 * 3. Faz o upload do resultado final para o IPFS.
 * 
 * @param rawData - A mensagem ou arquivo original (string ou buffer).
 * @param recipientPublicKey - A chave pública do destinatário para a criptografia.
 * @returns {Promise<string>} O CID (Content ID) do conteúdo final no IPFS.
 */
export const uploadToIpfs = async (rawData: string | Uint8Array, recipientPublicKey: string): Promise<string> => {
  console.log('[IPFS] Iniciando processo de upload completo...');

  // Passo 1: Comprimir
  const compressedData = compressData(rawData);

  // Passo 2: Criptografar
  const encryptedData = await encryptData(compressedData, recipientPublicKey);

  // Passo 3: Fazer o upload para o IPFS
  // A implementação real usaria um cliente IPFS (como 'kubo-rpc-client') para se conectar a um nó IPFS
  // ou faria um POST para um gateway IPFS público com permissão de escrita (ex: Infura, Pinata).
  console.log(`[IPFS] Fazendo upload dos dados criptografados para a rede IPFS (simulação)...`);
  
  // --- IMPLEMENTAÇÃO REAL COM PINATA (para o frontend) ---
  // No ambiente Vite (frontend), as variáveis de ambiente precisam do prefixo VITE_
  const pinataJwt = import.meta.env.VITE_PINATA_JWT;
  if (!pinataJwt) {
    console.error('[IPFS] A variável de ambiente VITE_PINATA_JWT não está configurada no arquivo .env do frontend.');    throw new Error('Chave da API do Pinata (PINATA_JWT) não configurada no .env do frontend.');
  }
  
  try {
    // No navegador, usamos a API FormData nativa.
    const formData = new FormData();
    // Criamos um Blob (Binary Large Object) a partir dos nossos dados criptografados.
    const file = new Blob([encryptedData], { type: 'application/octet-stream' });
    formData.append('file', file, 'sovereign-comm-payload.gz.enc');
    
    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        'Authorization': `Bearer ${pinataJwt}`
      }
    });
    
    const cid = response.data.IpfsHash;
    console.log(`[IPFS] Upload para o Pinata concluído. CID retornado: ${cid}`);
    return cid;
    
  } catch (error: any) {
    console.error('[IPFS] Falha no upload para o Pinata:', error.response?.data || error.message);    throw new Error('Falha ao fazer upload para o IPFS. Verifique a chave da API e a conexão.');
  }
};
