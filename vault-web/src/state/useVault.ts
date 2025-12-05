import { create } from "zustand";
import type { VaultHeader } from "@/crypto/format";

type VaultItem = {
  id?: string;
  name?: string;
  url?: string;
  username?: string;
  password?: string;
  notes?: string;
  updatedAt?: number;
};

type VaultDB = {
  version: number;
  items: VaultItem[];
};

type VaultState = {
  status: "locked" | "unlocking" | "opened" | "syncing";
  etag: string | null;
  key: CryptoKey | null;
  header: VaultHeader | null; // 👈 necesario para re-serializar
  db: VaultDB;

  setState: (p: Partial<VaultState>) => void;
  reset: () => void;
};

export const useVault = create<VaultState>((set) => ({
  status: "locked",
  etag: null,
  key: null,
  header: null,
  db: { version: 1, items: [] },

  setState: (p) => set(p),
  reset: () =>
    set({
      status: "locked",
      etag: null,
      key: null,
      header: null,
      db: { version: 1, items: [] },
    }),
}));
