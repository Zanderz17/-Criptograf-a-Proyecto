import { create } from "zustand";
import { setToken as apiSetToken } from "@/data/api";

type SessionState = {
  token: string | null;
  email: string;
  setSession: (p: { token: string | null; email: string }) => void;
  clear: () => void;
};

export const useSession = create<SessionState>((set) => ({
  token: null,
  email: "",
  setSession: ({ token, email }) => {
    apiSetToken(token);
    set({ token, email });
  },
  clear: () => {
    apiSetToken(null);
    set({ token: null, email: "" });
  },
}));
