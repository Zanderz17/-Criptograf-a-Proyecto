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

import { useVault } from "@/state/useVault";
import { saveVault } from "@/data/saveVault";
import { suggestPassword } from "@/utils/passwordGen";

export default function VaultCreate() {
  const nav = useNavigate();
  const { db, key, header, etag, setState } = useVault();
  const [url, setUrl] = React.useState("");
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!key || !header) {
      toast.error("Vault no desbloqueado");
      nav("/unlock");
      return;
    }

    const id = crypto.randomUUID();
    const newItem = {
      id,
      name: name || url || "(sin nombre)",
      url,
      username,
      password,
      updatedAt: Date.now(),
    };
    const newDB = { ...db, items: [newItem, ...(db.items ?? [])] };

    setState({ status: "syncing" });
    try {
      const res = await saveVault({ db: newDB, key, header, etag });
      setState({ db: newDB, etag: res.etag ?? etag, status: "opened" });
      toast.success("Guardado ✓");
      nav("/vault");
    } catch (err) {
      console.error(err);
      setState({ status: "opened" });
      toast.error("No se pudo guardar");
    }
  }

  return (
    <div className="min-h-svh grid place-items-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Nueva contraseña</CardTitle>
            <CardDescription className="text-xs">
              Se guardará en tu vault cifrado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. GitHub personal"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user">Usuario</Label>
                <Input
                  id="user"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pass">Contraseña</Label>
                  <Button
                    type="button"
                    className="h-7 px-2 text-xs"
                    onClick={() => setPassword(suggestPassword(20))}
                  >
                    Sugerir
                  </Button>
                </div>
                <Input
                  id="pass"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <Button type="submit" className="w-full">
                  Guardar
                </Button>

                <Button
                  type="button"
                  className="w-full mt-4"
                  onClick={() => nav("/vault")}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
