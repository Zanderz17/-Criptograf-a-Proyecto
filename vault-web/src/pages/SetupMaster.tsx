import React from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { gcmEncrypt } from "@/crypto/aead";
import { serializeVault, type VaultHeader } from "@/crypto/format";
import { idbPut } from "@/data/idb";
import { putVault } from "@/data/api";
import { useSession } from "@/state/useSession";

const MIN_LEN = 12;

export default function SetupMaster() {
  const nav = useNavigate();
  const token = useSession((s) => s.token); // puede ser null

  const [mp, setMp] = React.useState("");
  const [mp2, setMp2] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (mp.length < MIN_LEN) {
      toast.error(`Usa al menos ${MIN_LEN} caracteres`);
      return;
    }
    if (mp !== mp2) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const salt_b64 = btoa(String.fromCharCode(...salt));
      const header: VaultHeader = {
        format_version: 2,
        kdf: "pbkdf2-hmac-sha256",
        kdf_params: { iterations: 300000, salt_b64 },
        aead: "aes-256-gcm",
        nonce_len: 12,
      };

      const key = await deriveKeyPBKDF2(mp, salt);
      const enc = new TextEncoder();
      const headerBytes = enc.encode(JSON.stringify(header));

      const db = { version: 1, items: [] as any[] };
      const plaintext = enc.encode(JSON.stringify(db));

      const { nonce, ciphertext } = await gcmEncrypt(
        key,
        headerBytes,
        plaintext
      );

      const { bytes } = serializeVault(header, nonce, ciphertext);

      // 1) Siempre local
      await idbPut(bytes, "");

      // 2) Sync con backend SOLO si hay token
      if (token) {
        try {
          const { etag } = await putVault(bytes, null);
          console.log("💾 Vault sincronizado con backend. ETag:", etag);
        } catch (err) {
          console.warn(
            "⚠ Error al sincronizar con backend, se mantiene solo en cache local",
            err
          );
        }
      } else {
        console.log(
          "ℹ No hay token en sesión: vault creado solo en este dispositivo."
        );
      }

      toast.success("Master Password creada ✓");
      nav("/login");
    } catch (err) {
      console.error(err);
      toast.error("No se pudo crear la Master Password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-svh grid place-items-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Crear Master Password</CardTitle>
            <CardDescription className="text-xs">
              Se usa solo en tu dispositivo. No se envía al servidor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="flex flex-col gap-6">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mp">Master Password</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-6 px-2 text-xs !text-white hover:!text-white active:!text-white focus-visible:!text-white"
                    onClick={() => setShow((s) => !s)}
                  >
                    {show ? "Ocultar" : "Mostrar"}
                  </Button>
                </div>
                <Input
                  id="mp"
                  type={show ? "text" : "password"}
                  value={mp}
                  onChange={(e) => setMp(e.target.value)}
                  required
                  placeholder="Mínimo 12 caracteres"
                  autoComplete="new-password"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="mp2">Confirmar Master Password</Label>
                <Input
                  id="mp2"
                  type={show ? "text" : "password"}
                  value={mp2}
                  onChange={(e) => setMp2(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Guardando..." : "Crear Master Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
