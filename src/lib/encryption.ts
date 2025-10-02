// Client-side encryption for private messages
export interface EncryptionResult {
  encryptedMessage: string;
  isEncrypted: boolean;
}

/**
 * Request wallet signature to derive encryption key
 */
export async function requestWalletSignature(walletAddress: string): Promise<string> {
  console.log(`[Encryption] Requesting wallet signature...`);
  
  if (typeof window.ethereum === 'undefined') {
    throw new Error('Carteira não detectada. Por favor, instale MetaMask ou outra carteira.');
  }

  try {
    const message = `Sign this message to encrypt/decrypt your private messages on ChainChat.\n\nAddress: ${walletAddress}\nTimestamp: ${Date.now()}`;
    
    // Request signature from wallet
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, walletAddress],
    });

    console.log(`[Encryption] Signature obtained successfully`);
    return signature;
  } catch (error) {
    console.error(`[Encryption] Signature request failed:`, error);
    throw new Error('Assinatura negada. Você precisa assinar para enviar mensagens privadas.');
  }
}

/**
 * Derive encryption key from wallet signature
 */
async function deriveKeyFromSignature(signature: string): Promise<CryptoKey> {
  // Convert signature to byte array
  const encoder = new TextEncoder();
  const signatureData = encoder.encode(signature.slice(0, 64)); // Use first 64 chars
  
  // Import as raw key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    signatureData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive AES-GCM key
  const salt = encoder.encode('chainchat-encryption-salt');
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  return key;
}

/**
 * Encrypt message content using wallet signature
 * Uses Web Crypto API with AES-GCM encryption
 */
export async function encryptMessage(
  message: string,
  signature: string
): Promise<EncryptionResult> {
  console.log(`[Encryption] Encrypting message...`, { messageLength: message.length });

  try {
    const key = await deriveKeyFromSignature(signature);
    
    // Generate random IV (initialization vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encode message
    const encoder = new TextEncoder();
    const messageData = encoder.encode(message);
    
    // Encrypt
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      messageData
    );
    
    // Combine IV + encrypted data and convert to base64
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);
    
    const encryptedMessage = btoa(String.fromCharCode(...combined));
    
    console.log(`[Encryption] Message encrypted successfully`);
    
    return {
      encryptedMessage,
      isEncrypted: true
    };
  } catch (error) {
    console.error(`[Encryption] Encryption failed:`, error);
    throw new Error(`Falha na criptografia: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Decrypt message content using wallet signature
 */
export async function decryptMessage(
  encryptedMessage: string,
  signature: string
): Promise<string> {
  console.log(`[Encryption] Decrypting message...`);

  try {
    const key = await deriveKeyFromSignature(signature);
    
    // Decode base64
    const combined = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);
    
    // Decrypt
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encryptedData
    );
    
    // Decode message
    const decoder = new TextDecoder();
    const decryptedMessage = decoder.decode(decryptedData);
    
    console.log(`[Encryption] Message decrypted successfully`);
    
    return decryptedMessage;
  } catch (error) {
    console.error(`[Encryption] Decryption failed:`, error);
    throw new Error(`Falha na descriptografia: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

