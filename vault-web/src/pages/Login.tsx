import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { LoginForm } from "@/components/ui/8bit/blocks/login-form";
import { login } from "@/data/api";
import { useSession } from "@/state/useSession";

export default function Login() {
  const nav = useNavigate();
  const setSession = useSession((s) => s.setSession);

  const onSubmit: React.FormEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();

    const form = (e.target as HTMLElement).closest(
      "form"
    ) as HTMLFormElement | null;
    if (!form) return;

    const email =
      (form.elements.namedItem("email") as HTMLInputElement)?.value || "";
    const password =
      (form.elements.namedItem("password") as HTMLInputElement)?.value || "";

    try {
      const { token } = await login(email, password);

      // 🔐 ÚNICA fuente de verdad del token
      setSession({ token, email });

      toast.success("Sesión iniciada ✓");
      nav("/unlock");
    } catch {
      toast.error("Error de login");
    }
  };

  return (
    <div className="min-h-svh grid place-items-center p-4">
      <div className="w-full max-w-md">
        <LoginForm onSubmit={onSubmit} />
      </div>
    </div>
  );
}
