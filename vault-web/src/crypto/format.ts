// src/crypto/format.ts

const MAGIC_TEXT = "SKYVTv2\u0000"; // 8 bytes
const enc = new TextEncoder();
const dec = new TextDecoder();

/** Crea una vista Uint8Array segura (evita SharedArrayBuffer) */
function toU8(x: ArrayBuffer | Uint8Array): Uint8Array {
  if (x instanceof Uint8Array) {
    const copy = new Uint8Array(x.byteLength);
    copy.set(x);
    return copy;
  }
  return new Uint8Array(x);
}

export type VaultHeader = {
  format_version: number;
  kdf: "pbkdf2-hmac-sha256";
  kdf_params: { iterations: number; salt_b64: string };
  aead: "aes-256-gcm";
  nonce_len?: number; // por defecto 12
};

export type ParsedVault = {
  header: VaultHeader;
  headerBytes: Uint8Array;
  nonce: Uint8Array;
  ciphertext: Uint8Array; // incluye TAG de 16B al final (formato WebCrypto)
};

/**
 * Serializa el vault en el formato:
 * MAGIC | HEADER_LEN(4 LE) | HEADER(JSON UTF-8) | NONCE | CIPHERTEXT(inc TAG)
 * (Mantiene tu comportamiento exacto para no romper AAD)
 */
export function serializeVault(
  header: VaultHeader,
  nonce: Uint8Array,
  ciphertext: Uint8Array
) {
  const MAGIC = enc.encode(MAGIC_TEXT);
  const headerBytes = enc.encode(JSON.stringify(header));
  const headerLen = new Uint8Array(4);
  new DataView(headerLen.buffer).setUint32(0, headerBytes.length, true);

  const out = new Uint8Array(
    MAGIC.length + 4 + headerBytes.length + nonce.length + ciphertext.length
  );
  let o = 0;
  out.set(MAGIC, o);
  o += MAGIC.length;
  out.set(headerLen, o);
  o += 4;
  out.set(headerBytes, o);
  o += headerBytes.length;
  out.set(nonce, o);
  o += nonce.length;
  out.set(ciphertext, o);
  return { bytes: out, headerBytes };
}

/**
 * Variante opcional: usa headerBytes ya calculado para blindarte 100% contra cambios de orden.
 */
export function serializeVaultWithHeaderBytes(
  headerBytes: Uint8Array,
  nonce: Uint8Array,
  ciphertext: Uint8Array
) {
  const MAGIC = enc.encode(MAGIC_TEXT);
  const headerLen = new Uint8Array(4);
  new DataView(headerLen.buffer).setUint32(0, headerBytes.length, true);

  const out = new Uint8Array(
    MAGIC.length + 4 + headerBytes.length + nonce.length + ciphertext.length
  );
  let o = 0;
  out.set(MAGIC, o);
  o += MAGIC.length;
  out.set(headerLen, o);
  o += 4;
  out.set(headerBytes, o);
  o += headerBytes.length;
  out.set(nonce, o);
  o += nonce.length;
  out.set(ciphertext, o);
  return { bytes: out };
}

/**
 * Parsea un Uint8Array con el formato anterior y devuelve vistas ya separadas.
 * Tolerante: si no viene nonce_len, asume 12.
 */
export function parseVault(bytesInput: ArrayBuffer | Uint8Array): ParsedVault {
  const bytes = toU8(bytesInput);
  if (bytes.byteLength < 12) throw new Error("blob demasiado corto");

  const magic = dec.decode(bytes.slice(0, 8));
  if (magic !== MAGIC_TEXT) throw new Error("Formato inválido (MAGIC)");

  const hlen = new DataView(bytes.buffer, bytes.byteOffset + 8, 4).getUint32(
    0,
    true
  );
  const hStart = 12;
  const hEnd = hStart + hlen;
  if (hEnd > bytes.byteLength) throw new Error("HEADER_LEN fuera de rango");

  const headerBytes = bytes.slice(hStart, hEnd);
  let header: VaultHeader;
  try {
    header = JSON.parse(dec.decode(headerBytes));
  } catch {
    throw new Error("HEADER JSON inválido");
  }

  const nonceLen = typeof header.nonce_len === "number" ? header.nonce_len : 12;
  const nonceStart = hEnd;
  const nonceEnd = nonceStart + nonceLen;
  if (nonceEnd > bytes.byteLength) throw new Error("NONCE fuera de rango");

  const nonce = bytes.slice(nonceStart, nonceEnd);
  const ciphertext = bytes.slice(nonceEnd);
  if (ciphertext.byteLength < 16) throw new Error("CIPHERTEXT/TAG inválido");

  return { header, headerBytes, nonce, ciphertext };
}
