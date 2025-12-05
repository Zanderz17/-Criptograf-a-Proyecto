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
import { signup } from "@/data/api";

export default function SignUp() {
  const nav = useNavigate();
  const [email, setEmail] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [pw2, setPw2] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== pw2) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      await signup(email, pw);
      toast.success("Cuenta creada ✓");
      nav("/setup-master");
    } catch {
      toast.error("No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full w-full grid place-items-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign up</CardTitle>
            <CardDescription className="text-xs">
              Crea tu cuenta (esto no es tu Master Password)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
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
                  id="password"
                  type={show ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password2">Confirmar password</Label>
                <Input
                  id="password2"
                  type={show ? "text" : "password"}
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creando..." : "Crear cuenta"}
              </Button>

              <p className="text-center text-xs">
                ¿Ya tienes cuenta?{" "}
                <Link to="/login" className="underline underline-offset-4">
                  Inicia sesión
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
