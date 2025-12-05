// src/data/idb.ts
import { openDB } from "idb";
const DB = "vault-db";
const STORE = "vault";

export async function idbPut(blob: Uint8Array | ArrayBuffer, etag: string) {
  const db = await openDB(DB, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    },
  });
  const buf =
    blob instanceof Uint8Array
      ? blob.buffer.slice(blob.byteOffset, blob.byteOffset + blob.byteLength)
      : blob;

  await db.put(STORE, { blob: buf, etag, updatedAt: Date.now() }, "current");
}

export async function idbGet() {
  const db = await openDB(DB, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    },
  });
  return db.get(STORE, "current");
}
