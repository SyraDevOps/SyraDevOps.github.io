/* ========== SISTEMA DE CRIPTOGRAFIA & SEGURANÇA ==========
   Usa Web Crypto API (nativa em todos os browsers modernos)
   Protege dados sensíveis: username, identidade, prompts personalizados
*/

// ===== CONSTANTES =====
const ENCRYPTION_CONFIG = {
  ALGORITHM: 'AES-GCM',
  KEY_LENGTH: 256,
  SALT_LENGTH: 16,
  IV_LENGTH: 12,
  TAG_LENGTH: 128,
  ITERATIONS: 100000
};

// ===== GERAÇÃO DE CHAVE =====
/**
 * Deriva uma chave baseada em senha (master key para criptografia)
 * USA PBKDF2 para derivação segura
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  const key = await crypto.subtle.importKey('raw', data, 'PBKDF2', false, [
    'deriveBits',
    'deriveKey'
  ]);
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ENCRYPTION_CONFIG.ITERATIONS,
      hash: 'SHA-256'
    },
    key,
    { name: ENCRYPTION_CONFIG.ALGORITHM, length: ENCRYPTION_CONFIG.KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Gera salt aleatório para cada usuário
 */
function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.SALT_LENGTH));
}

/**
 * Gera IV (Initialization Vector) para cada criptografia
 */
function generateIV() {
  return crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.IV_LENGTH));
}

// ===== FUNÇÕES PRINCIPAIS =====
/**
 * Criptografa dado sensível
 * @param {string} plaintext - Texto a criptografar
 * @param {string} masterPassword - Master password do usuário
 * @returns {Promise<string>} Dado criptografado + salt + IV em base64
 */
async function encryptData(plaintext, masterPassword) {
  try {
    const salt = generateSalt();
    const iv = generateIV();
    const key = await deriveKey(masterPassword, salt);
    
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_CONFIG.ALGORITHM,
        iv: iv
      },
      key,
      data
    );
    
    // Combina salt + IV + ciphertext em um blob
    const encryptedArray = new Uint8Array(encryptedData);
    const combinedArray = new Uint8Array(
      salt.length + iv.length + encryptedArray.length
    );
    
    combinedArray.set(salt, 0);
    combinedArray.set(iv, salt.length);
    combinedArray.set(encryptedArray, salt.length + iv.length);
    
    // Converte para base64 para armazenar em localStorage
    return btoa(String.fromCharCode.apply(null, combinedArray));
  } catch (error) {
    console.error('Erro na criptografia:', error);
    throw new Error('Falha ao criptografar dados');
  }
}

/**
 * Descriptografa dado sensível
 * @param {string} encryptedBase64 - Dado criptografado em base64
 * @param {string} masterPassword - Master password do usuário
 * @returns {Promise<string>} Texto descriptografado original
 */
async function decryptData(encryptedBase64, masterPassword) {
  try {
    // Converte base64 para Uint8Array
    const combinedArray = new Uint8Array(
      atob(encryptedBase64)
        .split('')
        .map(char => char.charCodeAt(0))
    );
    
    // Extrai salt, IV e ciphertext
    const salt = combinedArray.slice(0, ENCRYPTION_CONFIG.SALT_LENGTH);
    const iv = combinedArray.slice(
      ENCRYPTION_CONFIG.SALT_LENGTH,
      ENCRYPTION_CONFIG.SALT_LENGTH + ENCRYPTION_CONFIG.IV_LENGTH
    );
    const encryptedData = combinedArray.slice(
      ENCRYPTION_CONFIG.SALT_LENGTH + ENCRYPTION_CONFIG.IV_LENGTH
    );
    
    // Deriva a mesma chave
    const key = await deriveKey(masterPassword, salt);
    
    // Descriptografa
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_CONFIG.ALGORITHM,
        iv: iv
      },
      key,
      encryptedData
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Erro na descriptografia:', error);
    throw new Error('Falha ao descriptografar dados - senha incorreta?');
  }
}

// ===== HASH SEGURO (para verificação, não armazenar senha) =====
/**
 * Gera hash SHA-256 de um valor (para verificação de integridade)
 * @param {string} data - Dados a hasherizar
 * @returns {Promise<string>} Hash em hex
 */
async function hashData(data) {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ===== SANITIZAÇÃO DE INPUT =====
/**
 * Remove caracteres perigosos de input do usuário (XSS prevention)
 * @param {string} input - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Valida email básico
 * @param {string} email - Email a validar
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Remove tags HTML perigosas (mantém text content)
 * @param {string} html - HTML a limpar
 * @returns {string} HTML sanitizado
 */
function sanitizeHTML(html) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Remove scripts
  const scripts = tempDiv.querySelectorAll('script');
  scripts.forEach(s => s.remove());
  
  // Remove event handlers inline
  tempDiv.querySelectorAll('*').forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    });
  });
  
  return tempDiv.innerHTML;
}

// ===== GERENCIAMENTO SEGURO DE PASSWORD =====
/**
 * Valida força da senha
 * @param {string} password - Senha a validar
 * @returns {object} { score: 0-4, feedback: string }
 */
function validatePasswordStrength(password) {
  let score = 0;
  const feedback = [];
  
  if (!password) return { score: 0, feedback: ['Senha obrigatória'] };
  
  if (password.length >= 8) score++;
  else feedback.push('Mínimo 8 caracteres');
  
  if (password.length >= 12) score++;
  else feedback.push('Usa 12+ caracteres para melhor segurança');
  
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  else feedback.push('Misture maiúsculas e minúsculas');
  
  if (/[0-9]/.test(password) && /[!@#$%^&*]/.test(password)) score++;
  else feedback.push('Inclua números e caracteres especiais');
  
  return { score, feedback };
}

// ===== VERIFICAÇÃO DE COMPLETUDE DE DADOS =====
/**
 * Verifica integridade de dados em localStorage (não foi alterado)
 * @param {string} key - Chave no localStorage
 * @param {string} expectedHash - Hash esperado
 * @returns {Promise<boolean>}
 */
async function verifyDataIntegrity(key, expectedHash) {
  try {
    const data = localStorage.getItem(key);
    if (!data) return false;
    
    const computedHash = await hashData(data);
    return computedHash === expectedHash;
  } catch (error) {
    console.error('Erro ao verificar integridade:', error);
    return false;
  }
}

// ===== CLEAR SENSITIVE DATA =====
/**
 * Limpa dados sensíveis quando usuário faz logout
 * @param {string[]} keysToKeep - Chaves que devem ser mantidas
 */
function clearSensitiveData(keysToKeep = []) {
  const allKeys = Object.keys(localStorage);
  const keysToRemove = [
    'qd_web_profile_settings_v1',
    'qd_web_session_token',
    'qd_web_temp_data'
  ];
  
  keysToRemove.forEach(key => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  });
}

// ===== EXPORTAR FUNÇÕES =====
// Para usar: import { encryptData, decryptData } from './crypto-utils.js'
// Ou no HTML: <script src="crypto-utils.js"></script>

if (typeof window !== 'undefined') {
  window.CryptoUtils = {
    encryptData,
    decryptData,
    hashData,
    sanitizeInput,
    sanitizeHTML,
    isValidEmail,
    validatePasswordStrength,
    verifyDataIntegrity,
    clearSensitiveData,
    generateSalt,
    generateIV
  };
}
