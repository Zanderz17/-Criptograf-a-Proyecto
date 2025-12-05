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
  header: VaultHeader; // viene del parseVault (Unlock)
  etag: string | null;
}): Promise<{ etag: string | null }> {
  // normalizamos header por si viene medio incompleto
  const h: VaultHeader = {
    format_version: header.format_version ?? 2,
    kdf: "pbkdf2-hmac-sha256",
    kdf_params: {
      iterations: header.kdf_params.iterations ?? 300000,
      salt_b64: header.kdf_params.salt_b64,
    },
    aead: "aes-256-gcm",
    nonce_len: header.nonce_len ?? 12,
  };

  const enc = new TextEncoder();
  const headerBytes = enc.encode(JSON.stringify(h));
  const plaintext = enc.encode(JSON.stringify(db));

  const { nonce, ciphertext } = await gcmEncrypt(key, headerBytes, plaintext);
  const { bytes } = serializeVault(h, nonce, ciphertext);

  // 1) Guardar SIEMPRE local con el etag que tengas (aunque sea null)
  await idbPut(bytes, etag ?? "");

  // 2) Intentar sincronizar con backend
  try {
    // 👇 IMPORTANTE: si etag es null, se pasa null, NO ""
    const { etag: newEtag } = await putVault(bytes, etag);

    const effectiveEtag = newEtag ?? etag ?? null;

    // Actualizamos el ETag local con el más nuevo que tengamos
    await idbPut(bytes, effectiveEtag ?? "");

    return { etag: effectiveEtag };
  } catch (err) {
    console.warn("No se pudo sincronizar con backend, se queda local:", err);
    // Nos quedamos con el etag anterior (o null) para modo offline
    return { etag };
  }
}
