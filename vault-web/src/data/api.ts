// src/data/api.ts
let TOKEN: string | null = null;

export function setToken(t: string | null) {
  TOKEN = t;
}

import { useSession } from "@/state/useSession";

let _ = useSession; // para que bundlers no lo eliminen por tree-shaking

function toRealArrayBuffer(src: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (src instanceof ArrayBuffer) return src;
  const { buffer, byteOffset, byteLength } = src;
  const view = new Uint8Array(buffer, byteOffset, byteLength);
  const copy = new Uint8Array(byteLength);
  copy.set(view);
  return copy.buffer;
}

function getToken(): string | null {
  return useSession.getState().token;
}

export async function login(
  email: string,
  password: string
): Promise<{ token: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("Login falló:", res.status, txt);
    throw new Error("Login failed");
  }

  return res.json();
}

export async function signup(
  email: string,
  password: string
): Promise<{ ok: true }> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("Signup falló:", res.status, txt);
    throw new Error("Signup failed");
  }

  return { ok: true };
}

export async function putVault(
  buf: ArrayBuffer | Uint8Array,
  etag: string | null
): Promise<{ etag: string }> {
  const bodyAb = toRealArrayBuffer(buf);
  const token = getToken();

  if (!token) {
    console.warn("putVault llamado sin token → no autenticado");
    throw new Error("not authenticated");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/octet-stream",
  };
  if (etag) headers["If-Match"] = etag;

  console.log("TOKEN usado en PUT /api/vault:", token);

  const res = await fetch("/api/vault", {
    method: "PUT",
    headers,
    body: bodyAb,
  });

  console.log("PUT /api/vault status", res.status);

  if (!res.ok) {
    const txt = await res.text();
    console.error("PUT /api/vault no ok:", res.status, txt);
    throw new Error("PUT fail");
  }

  return { etag: res.headers.get("ETag") || "" };
}

export async function getVault(): Promise<{ buf: ArrayBuffer; etag: string }> {
  const token = getToken();

  if (!token) {
    console.warn("getVault llamado sin token → no autenticado");
    throw new Error("not authenticated");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  const res = await fetch("/api/vault", { headers });

  if (!res.ok) {
    const txt = await res.text();
    console.error("GET /api/vault no ok:", res.status, txt);
    throw new Error("GET /vault");
  }

  const etag = res.headers.get("ETag") || "";
  const buf = await res.arrayBuffer();
  return { buf, etag };
}
