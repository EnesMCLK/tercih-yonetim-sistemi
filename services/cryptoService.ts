// Helper functions for conversion
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};

const hexToArrayBuffer = (hex: string): ArrayBuffer => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
};

const arrayBufferToHex = (buffer: ArrayBuffer): string => {
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
};


export const cryptoService = {
  /**
   * Hashes a password with PBKDF2 and a salt. Used for verification.
   */
  hashPassword: async (password: string, saltHex: string): Promise<string> => {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = hexToArrayBuffer(saltHex);

    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256 // 256 bits
    );
      
    return arrayBufferToHex(derivedBits);
  },

  /**
   * Derives a cryptographic key from a password and salt using PBKDF2.
   * This key is used for encrypting/decrypting data, not for password storage.
   */
  deriveSessionKey: async (password: string, saltHex: string): Promise<CryptoKey> => {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = hexToArrayBuffer(saltHex);

    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  },
  
  /**
   * Encrypts data (like the preferences array) using AES-GCM.
   */
  encrypt: async (data: any, key: CryptoKey): Promise<string> => {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV

    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encodedData
    );

    // Combine IV and ciphertext for storage
    const combinedBuffer = new Uint8Array(iv.length + encryptedContent.byteLength);
    combinedBuffer.set(iv, 0);
    combinedBuffer.set(new Uint8Array(encryptedContent), iv.length);

    return arrayBufferToBase64(combinedBuffer);
  },
  
  /**
   * Decrypts data using AES-GCM.
   */
  decrypt: async <T>(encryptedBase64: string, key: CryptoKey): Promise<T> => {
    const combinedBuffer = base64ToArrayBuffer(encryptedBase64);
    
    const iv = combinedBuffer.slice(0, 12);
    const ciphertext = combinedBuffer.slice(12);

    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    const decryptedString = decoder.decode(decryptedContent);
    return JSON.parse(decryptedString) as T;
  },

  /**
   * Generates a random salt for a new user.
   */
  generateSalt: (): string => {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    return arrayBufferToHex(salt);
  }
};