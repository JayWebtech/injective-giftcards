"use client";

import { useCallback, useEffect, useState } from "react";

export const INJECTIVE_CHAIN_ID = "injective-888";

export function useKeplr() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const anyWindow = window as any;
      if (!anyWindow.keplr) {
        setError("Please install Keplr wallet extension");
        window.open("https://www.keplr.app/", "_blank");
        return;
      }

      await anyWindow.keplr.enable(INJECTIVE_CHAIN_ID);
      const offlineSigner = anyWindow.keplr.getOfflineSigner(INJECTIVE_CHAIN_ID);
      const accounts = await offlineSigner.getAccounts();
      if (!accounts.length) {
        setError("No Injective accounts found in Keplr");
        return;
      }
      setAddress(accounts[0].address);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to connect Keplr");
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
  }, []);

  useEffect(() => {
    // Attempt silent reconnect on mount
    const anyWindow = window as any;
    if (!anyWindow.keplr) return;
    anyWindow.keplr.enable(INJECTIVE_CHAIN_ID).then(async () => {
      const offlineSigner = anyWindow.keplr.getOfflineSigner(INJECTIVE_CHAIN_ID);
      const accounts = await offlineSigner.getAccounts();
      if (accounts.length) {
        setAddress(accounts[0].address);
      }
    }).catch(() => {
      // ignore
    });
  }, []);

  return {
    address,
    isConnected: !!address,
    loading,
    error,
    connect,
    disconnect,
  };
}

