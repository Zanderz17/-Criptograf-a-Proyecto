import { gcmEncrypt } from "@/crypto/aead";
import { serializeVault, type VaultHeader } from "@/crypto/format";
import { idbPut } from "@/data/idb";
import { putVault } from "@/data/api";

export async function saveVault({
  db,
  key,
  header,
  etag,
}: {
  db: { version: number; items: any[] };
  key: CryptoKey;
  header: VaultHeader; // debe tener kdf_params.salt_b64 y nonce_len (12)
  etag: string | null;
}): Promise<{ etag: string | null }> {
  // Normaliza sin cambiar KDF/AEAD
  const normalizedHeader: VaultHeader = {
    format_version: header.format_version ?? 2,
    kdf: "pbkdf2-hmac-sha256",
    kdf_params: {
      iterations: header.kdf_params?.iterations ?? 300000,
      salt_b64: header.kdf_params?.salt_b64,
    },
    aead: "aes-256-gcm",
    nonce_len: header.nonce_len ?? 12,
  };

  const enc = new TextEncoder();
  const headerBytes = enc.encode(JSON.stringify(normalizedHeader));
  const plaintext = enc.encode(JSON.stringify(db));

  const { nonce, ciphertext } = await gcmEncrypt(key, headerBytes, plaintext);
  const { bytes } = serializeVault(normalizedHeader, nonce, ciphertext);

  // guarda local
  await idbPut(bytes, etag ?? "");

  // intenta servidor
  try {
    const res = await putVault(bytes, etag ?? "");
    const newEtag = res.etag || null;
    await idbPut(bytes, newEtag ?? "");
    return { etag: newEtag };
  } catch {
    return { etag };
  }
}
