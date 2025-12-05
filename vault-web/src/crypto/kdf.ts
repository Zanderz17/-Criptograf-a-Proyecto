// src/crypto/kdf.ts

// Copia cualquier BufferSource a un ArrayBuffer "real" (no SharedArrayBuffer)
function toArrayBuffer(src: ArrayBufferView | ArrayBuffer): ArrayBuffer {
  if (src instanceof ArrayBuffer) return src;
  const { buffer, byteOffset, byteLength } = src;
  // Creamos una vista sobre el buffer original (ArrayBufferLike, incluso SAB)
  const view = new Uint8Array(buffer, byteOffset, byteLength);
  // Copiamos a un nuevo ArrayBuffer (garantizado)
  const copy = new Uint8Array(byteLength);
  copy.set(view);
  return copy.buffer;
}

export async function deriveKeyPBKDF2(
  master: string,
  saltInput: ArrayBufferView | ArrayBuffer // acepta Uint8Array, DataView, etc.
): Promise<CryptoKey> {
  const enc = new TextEncoder();

  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(master),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const saltAb = toArrayBuffer(saltInput); // 👈 normaliza a ArrayBuffer

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltAb, iterations: 300000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
