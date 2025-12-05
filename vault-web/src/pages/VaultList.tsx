// src/pages/VaultList.tsx

import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/8bit/card";
import { Input } from "@/components/ui/8bit/input";
import { Button } from "@/components/ui/8bit/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/8bit/tabs";

import { useVault } from "@/state/useVault";

function mask(s?: string, show?: boolean) {
  if (!s) return "";
  return show ? s : "•".repeat(Math.min(s.length, 12));
}

export default function VaultList() {
  const nav = useNavigate();
  const { db } = useVault();
  const [q, setQ] = React.useState("");
  const [reveal, setReveal] = React.useState<Record<string, boolean>>({});

  const items = React.useMemo(() => {
    const src = db?.items ?? [];
    const t = q.trim().toLowerCase();
    if (!t) return src;
    return src.filter((it) =>
      [it.name, it.url, it.username].some((v) =>
        (v ?? "").toLowerCase().includes(t)
      )
    );
  }, [db, q]);

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado ✓`);
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  return (
    <div className="min-h-svh grid place-items-center p-4">
      <div className="w-full max-w-2xl">
        <Tabs defaultValue="pw" className="w-full">
          <TabsList className="flex w-full gap-3 mb-5">
            <TabsTrigger
              value="pw"
              className="flex-1 text-white data-[state=active]:text-yellow-300"
            >
              Contraseñas
            </TabsTrigger>
            <TabsTrigger
              value="acct"
              className="flex-1 text-white data-[state=active]:text-yellow-300"
            >
              Cuenta
            </TabsTrigger>
          </TabsList>

          <div className="flex justify-start mb-2">
            <Button className="h-8 text-xs" onClick={() => nav("/vault/new")}>
              Añadir contraseña
            </Button>
          </div>

          <TabsContent value="pw">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Contraseñas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Buscar (nombre, URL o usuario)…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />

                <div className="text-xs opacity-70">
                  {items.length} resultado{items.length === 1 ? "" : "s"}
                </div>

                <ul className="space-y-3">
                  {items.map((it) => {
                    const key = it.id ?? "";
                    const show = !!reveal[key];
                    return (
                      <li key={key} className="border rounded-md p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium truncate leading-tight">
                              {it.name ?? it.url ?? "(sin nombre)"}
                            </div>

                            {it.username ? (
                              <div className="mt-2 text-sm">
                                <span className="opacity-70">Usuario: </span>
                                <span className="font-mono">{it.username}</span>
                              </div>
                            ) : null}

                            {it.password ? (
                              <div className="mt-1 text-sm flex items-center">
                                <span className="opacity-70 mr-1">
                                  Contraseña:
                                </span>
                                <span className="font-mono">
                                  {mask(it.password, show)}
                                </span>
                              </div>
                            ) : null}
                          </div>

                          <div className="flex flex-col gap-3 pl-3 shrink-0">
                            {it.username ? (
                              <Button
                                className="h-8 px-3 text-xs"
                                onClick={() => copy(it.username!, "Usuario")}
                                aria-label="Copiar usuario"
                              >
                                Copiar user
                              </Button>
                            ) : null}

                            {it.password ? (
                              <Button
                                className="h-8 px-3 text-xs"
                                onClick={() => copy(it.password!, "Contraseña")}
                                aria-label="Copiar contraseña"
                              >
                                Copiar pass
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {items.length === 0 && (
                  <div className="text-sm opacity-70">
                    No hay resultados. ¿Deseas{" "}
                    <Link className="underline" to="/vault/new">
                      crear una contraseña
                    </Link>
                    ?
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="acct">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Cuenta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  Estado: <b>{useVault.getState().status}</b>
                </div>
                <Button
                  className="h-8 text-xs"
                  onClick={() => {
                    useVault.getState().reset();
                    toast.success("Sesión bloqueada");
                  }}
                >
                  Cerrar Sesión
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
