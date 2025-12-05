// src/pages/Unlock.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/8bit/card";
import { Label } from "@/components/ui/8bit/label";
import { Input } from "@/components/ui/8bit/input";
import { Button } from "@/components/ui/8bit/button";

import { deriveKeyPBKDF2 } from "@/crypto/kdf";
import { gcmDecrypt } from "@/crypto/aead";
import { parseVault } from "@/crypto/format";
import { idbGet } from "@/data/idb";
import { getVault } from "@/data/api";
import { useVault } from "@/state/useVault";

function toUint8ArrayFromBuffer(
  buf: ArrayBuffer | SharedArrayBuffer | null | undefined
): Uint8Array | null {
  if (!buf) return null;
  const view = new Uint8Array(
    buf as ArrayBuffer,
    0,
    (buf as ArrayBuffer).byteLength
  );
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  return copy;
}

// ---- NUEVO: prefiero IDB y luego red
async function fetchBlobPreferIDB(): Promise<{
  bytes: Uint8Array;
  etag: string | null;
  source: "idb" | "net";
}> {
  const local = await idbGet();
  if (local?.blob) {
    const u8 = toUint8ArrayFromBuffer(local.blob);
    if (u8 && u8.byteLength >= 8)
      return { bytes: u8, etag: local.etag || null, source: "idb" };
  }
  const { buf, etag } = await getVault(); // lanzará si backend no está
  const u8 = toUint8ArrayFromBuffer(buf);
  if (!u8) throw new Error("empty buf from server");
  return { bytes: u8, etag, source: "net" };
}

export default function Unlock() {
  const nav = useNavigate();
  const setVault = useVault((s) => s.setState);
  const [mp, setMp] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const el = document.getElementById("mp");
    if (el) (el as HTMLInputElement).focus();
  }, []);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!mp) {
      toast.error("Ingresa la Master Password");
      return;
    }
    setLoading(true);
    setVault({ status: "unlocking" });
    try {
      const { bytes, etag, source } = await fetchBlobPreferIDB();

      // ---- NUEVO: verificación defensiva de MAGIC
      const magic = new TextDecoder().decode(bytes.slice(0, 8));
      if (magic !== "SKYVTv2\u0000") {
        console.warn(
          "Contenido no-vault (fuente:",
          source,
          "):",
          new TextDecoder().decode(bytes.slice(0, 16))
        );
        throw new Error(
          "No se encontró un vault válido. Crea uno en Setup Master."
        );
      }

      const parsed = parseVault(bytes);
      const headerBytes = parsed.headerBytes;
      const header = parsed.header;

      const salt_b64 = header?.kdf_params?.salt_b64;
      if (!salt_b64) throw new Error("header missing salt");
      const salt = Uint8Array.from(atob(salt_b64), (c) => c.charCodeAt(0));

      const key = await deriveKeyPBKDF2(mp, salt);

      const pt = await gcmDecrypt(
        key,
        headerBytes,
        parsed.nonce,
        parsed.ciphertext
      );

      const dec = new TextDecoder();
      const json = dec.decode(pt);
      let db: any;
      try {
        db = JSON.parse(json);
      } catch {
        throw new Error("JSON parse error (vault corrupt)");
      }

      setVault({
        status: "opened",
        key,
        etag: etag || null,
        db,
        header,
      });

      toast.success("Vault desbloqueado ✓");
      nav("/vault");
    } catch (err: any) {
      console.error(err);
      const msg =
        err instanceof DOMException ||
        (err && /tag|authentication/i.test(String(err.message)))
          ? "Master Password incorrecta o vault corrupto (verifica MP)."
          : String(err?.message || "No se pudo abrir el vault");
      toast.error(msg);
      setVault({ status: "locked", key: null });
    } finally {
      setLoading(false);
      setMp("");
    }
  };

  return (
    <div className="min-h-svh grid place-items-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Desbloquear Vault</CardTitle>
            <CardDescription className="text-xs">
              Ingresa tu Master Password (se queda solo en este navegador)
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={onSubmit}
              className="flex flex-col gap-6"
              aria-label="Unlock form"
            >
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mp">Master Password</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-6 px-2 text-xs !text-white hover:!text-white active:!text-white focus-visible:!text-white"
                    onClick={() => setShow((s) => !s)}
                    aria-label={
                      show ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {show ? "Ocultar" : "Mostrar"}
                  </Button>
                </div>
                <Input
                  id="mp"
                  name="mp"
                  type={show ? "text" : "password"}
                  value={mp}
                  onChange={(e) => setMp(e.target.value)}
                  required
                  autoComplete="current-password"
                  aria-label="Master Password"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Desbloqueando..." : "Desbloquear"}
                </Button>
              </div>

              <p className="text-xs text-center">
                Si no tienes un vault, crea uno en{" "}
                <a className="underline" href="/signup">
                  Sign up
                </a>{" "}
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
