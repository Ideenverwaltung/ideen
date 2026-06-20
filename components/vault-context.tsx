"use client";

import { createClient } from "@/lib/supabase/client";
import {
  buildVerifier,
  decryptText,
  encryptText,
  verifyPassword,
  type Cipher,
} from "@/lib/crypto";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type VaultStatus = "loading" | "needs-setup" | "locked" | "unlocked";

interface VaultCtx {
  status: VaultStatus;
  setup: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  encrypt: (text: string) => Promise<Cipher>;
  decrypt: (cipher: Cipher) => Promise<string>;
}

const Ctx = createContext<VaultCtx | null>(null);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [status, setStatus] = useState<VaultStatus>("loading");
  const [key, setKey] = useState<CryptoKey | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("vault_meta")
        .select("user_id")
        .maybeSingle();
      if (!active) return;
      setStatus(data ? "locked" : "needs-setup");
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setup = useCallback(
    async (password: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Nicht angemeldet");
      const v = await buildVerifier(password);
      const { error } = await supabase.from("vault_meta").insert({
        user_id: uid,
        verifier_ciphertext: v.verifier_ciphertext,
        verifier_iv: v.verifier_iv,
        salt: v.salt,
      });
      if (error) throw error;
      const ok = await unlock(password);
      if (!ok) throw new Error("Einrichtung fehlgeschlagen");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const unlock = useCallback(
    async (password: string) => {
      const { data, error } = await supabase
        .from("vault_meta")
        .select("verifier_ciphertext, verifier_iv, salt")
        .maybeSingle();
      if (error || !data) return false;
      const k = await verifyPassword(
        password,
        data.salt,
        data.verifier_ciphertext,
        data.verifier_iv,
      );
      if (!k) return false;
      setKey(k);
      setStatus("unlocked");
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const lock = useCallback(() => {
    setKey(null);
    setStatus("locked");
  }, []);

  const encrypt = useCallback(
    async (text: string) => {
      if (!key) throw new Error("Tresor gesperrt");
      return encryptText(key, text);
    },
    [key],
  );

  const decrypt = useCallback(
    async (cipher: Cipher) => {
      if (!key) throw new Error("Tresor gesperrt");
      return decryptText(key, cipher);
    },
    [key],
  );

  return (
    <Ctx.Provider value={{ status, setup, unlock, lock, encrypt, decrypt }}>
      {children}
    </Ctx.Provider>
  );
}

export function useVault() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVault muss innerhalb von VaultProvider sein");
  return ctx;
}
