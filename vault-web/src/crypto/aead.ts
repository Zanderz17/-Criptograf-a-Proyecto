// src/crypto/aead.ts

// Copia cualquier BufferSource a un ArrayBuffer "real" (no SharedArrayBuffer)
function toArrayBuffer(src: ArrayBufferView | ArrayBuffer): ArrayBuffer {
  if (src instanceof ArrayBuffer) return src;
  const { buffer, byteOffset, byteLength } = src;
  const view = new Uint8Array(buffer, byteOffset, byteLength);
  const copy = new Uint8Array(byteLength);
  copy.set(view);
  return copy.buffer;
}

export async function gcmEncrypt(
  key: CryptoKey,
  headerBytes: Uint8Array,
  plaintextBytes: Uint8Array
) {
  // Normalizamos todos los BufferSource
  const iv = new Uint8Array(
    toArrayBuffer(crypto.getRandomValues(new Uint8Array(12)))
  );
  const aad = toArrayBuffer(headerBytes);
  const data = toArrayBuffer(plaintextBytes);

  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: aad, tagLength: 128 },
    key,
    data
  );

  return { nonce: iv, ciphertext: new Uint8Array(ct) };
}

export async function gcmDecrypt(
  key: CryptoKey,
  headerBytes: Uint8Array,
  nonce: Uint8Array,
  ciphertext: Uint8Array
) {
  // Normalizamos todos los BufferSource
  const iv = new Uint8Array(toArrayBuffer(nonce));
  const aad = toArrayBuffer(headerBytes);
  const data = toArrayBuffer(ciphertext);

  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, additionalData: aad, tagLength: 128 },
    key,
    data
  );

  return new Uint8Array(pt);
}
