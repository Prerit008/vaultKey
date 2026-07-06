import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import {
  fetchVaultStatus,
  fetchVaultBlob,
  saveVaultBlob,
  destroyVault,
} from "../lib/vaultApi";
import {
  encryptVault,
  encryptVaultWithSalt,
  decryptVault,
} from "../lib/crypto";
import { toast } from "sonner";

const VaultContext = createContext(null);

const AUTO_LOCK_MS = 5 * 60 * 1000; // 5 minutes idle → auto-lock

function emptyVault() {
  return { entries: [], created_at: new Date().toISOString(), version: 1 };
}

export function VaultProvider({ children }) {
  const [status, setStatus] = useState({ loading: true, initialized: false });
  const [unlocked, setUnlocked] = useState(false);
  const [vault, setVault] = useState(null); // { entries, ... }
  const passwordRef = useRef(null); // in-memory master password
  const saltRef = useRef(null); // base64 salt
  const idleTimerRef = useRef(null);

  const refreshStatus = useCallback(async () => {
    try {
      const s = await fetchVaultStatus();
      setStatus({ loading: false, ...s });
      return s;
    } catch (e) {
      setStatus({ loading: false, initialized: false, error: String(e) });
      return null;
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const lock = useCallback(() => {
    passwordRef.current = null;
    saltRef.current = null;
    setVault(null);
    setUnlocked(false);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (!unlocked) return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      toast.warning("Auto-locked due to inactivity");
      lock();
    }, AUTO_LOCK_MS);
  }, [unlocked, lock]);

  useEffect(() => {
    if (!unlocked) return;
    const events = ["mousemove", "keydown", "click", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetIdleTimer));
    resetIdleTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [unlocked, resetIdleTimer]);

  // Create a brand new vault (first-run).
  const createVault = useCallback(async (masterPassword) => {
    const empty = emptyVault();
    const blob = await encryptVault(JSON.stringify(empty), masterPassword);
    await saveVaultBlob(blob);
    passwordRef.current = masterPassword;
    saltRef.current = blob.salt;
    setVault(empty);
    setUnlocked(true);
    await refreshStatus();
  }, [refreshStatus]);

  // Attempt to unlock an existing vault by decrypting the fetched blob.
  const unlock = useCallback(async (masterPassword) => {
    const blob = await fetchVaultBlob();
    const plain = await decryptVault(blob, masterPassword); // throws on wrong password
    const parsed = JSON.parse(plain);
    passwordRef.current = masterPassword;
    saltRef.current = blob.salt;
    setVault(parsed);
    setUnlocked(true);
  }, []);

  // Persist current vault state, re-encrypting with the same master password + salt.
  const persist = useCallback(async (nextVault) => {
    if (!passwordRef.current || !saltRef.current) throw new Error("Vault is locked");
    const blob = await encryptVaultWithSalt(
      JSON.stringify(nextVault),
      passwordRef.current,
      saltRef.current,
    );
    await saveVaultBlob(blob);
    setVault(nextVault);
  }, []);

  const addEntry = useCallback(async (entry) => {
    const now = new Date().toISOString();
    const withId = {
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      ...entry,
    };
    const next = { ...vault, entries: [withId, ...(vault?.entries || [])] };
    await persist(next);
    return withId;
  }, [vault, persist]);

  const addEntries = useCallback(async (newEntries) => {
    const now = new Date().toISOString();
    const withIds = newEntries.map(entry => ({
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      ...entry,
    }));
    const next = { ...vault, entries: [...withIds, ...(vault?.entries || [])] };
    await persist(next);
    return withIds;
  }, [vault, persist]);

  const updateEntry = useCallback(async (id, patch) => {
    const next = {
      ...vault,
      entries: (vault?.entries || []).map((e) =>
        e.id === id ? { ...e, ...patch, updated_at: new Date().toISOString() } : e,
      ),
    };
    await persist(next);
  }, [vault, persist]);

  const deleteEntry = useCallback(async (id) => {
    const next = {
      ...vault,
      entries: (vault?.entries || []).filter((e) => e.id !== id),
    };
    await persist(next);
  }, [vault, persist]);

  const changeMasterPassword = useCallback(async (newPassword) => {
    if (!vault) throw new Error("Vault is locked");
    const blob = await encryptVault(JSON.stringify(vault), newPassword);
    await saveVaultBlob(blob);
    passwordRef.current = newPassword;
    saltRef.current = blob.salt;
  }, [vault]);

  const exportEncrypted = useCallback(async () => {
    const blob = await fetchVaultBlob();
    return blob; // encrypted JSON — safe to share/store
  }, []);

  const importEncrypted = useCallback(async (blob, password) => {
    // verify decrypt first
    const plain = await decryptVault(blob, password);
    JSON.parse(plain); // must parse
    await saveVaultBlob(blob);
    await refreshStatus();
  }, [refreshStatus]);

  const wipeVault = useCallback(async () => {
    await destroyVault();
    lock();
    await refreshStatus();
  }, [lock, refreshStatus]);

  const value = {
    status,
    unlocked,
    vault,
    refreshStatus,
    createVault,
    unlock,
    lock,
    addEntry,
    addEntries,
    updateEntry,
    deleteEntry,
    changeMasterPassword,
    exportEncrypted,
    importEncrypted,
    wipeVault,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used within VaultProvider");
  return ctx;
}