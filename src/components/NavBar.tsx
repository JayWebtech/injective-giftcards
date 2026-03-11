"use client";

import Link from "next/link";
import { useKeplr } from "@/hooks/useKeplr";
import { useState } from "react";

function shortAddr(addr: string) {
  return addr.slice(0, 8) + "…" + addr.slice(-4);
}

export default function NavBar() {
  const { address, isConnected, loading, connect, disconnect } = useKeplr();
  const [showAccount, setShowAccount] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleWalletClick = () => {
    if (isConnected && address) {
      setShowAccount(true);
    } else {
      void connect();
    }
  };

  const short = address ? shortAddr(address) : "";

  return (
    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6 lg:px-8">
      <Link href="/">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded border border-white/60 text-xs font-mono">
            GI
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted">
              Injective Africa
            </div>
            <div className="font-serif text-lg font-semibold -mt-1">
              GiftINJ
            </div>
          </div>
        </div>
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link
          href="/create"
          className="rounded-full border border-white/60 px-4 py-1.5 text-sm font-medium text-white hover:bg-white hover:text-black"
        >
          Create Gift Card
        </Link>
        <button
          type="button"
          onClick={handleWalletClick}
          className="ml-2 rounded-full border border-white/60 px-3 py-1.5 text-sm font-mono text-white hover:bg-white hover:text-black"
        >
          {isConnected && address
            ? short
            : loading
              ? "Connecting…"
              : "Connect Keplr"}
        </button>
      </nav>
      {showAccount && isConnected && address && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/70"
          onClick={() => setShowAccount(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-neutral-700 bg-black px-5 py-4 text-sm text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold">Connected wallet</span>
              <button
                type="button"
                className="text-xs text-muted hover:text-white"
                onClick={() => setShowAccount(false)}
              >
                ✕
              </button>
            </div>
            <div className="mb-3 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted">
                Injective address
              </div>
              <div className="mt-1 break-all font-mono text-xs">{address}</div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-full border border-white/60 px-3 py-2 text-xs font-mono text-white hover:bg-white hover:text-black"
                onClick={() => {
                  navigator.clipboard.writeText(address).catch(() => {});
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? "Copied" : "Copy address"}
              </button>
              <button
                type="button"
                className="flex-1 rounded-full border border-neutral-600 px-3 py-2 text-xs font-mono text-neutral-200 hover:bg-neutral-200 hover:text-black"
                onClick={() => {
                  disconnect();
                  setShowAccount(false);
                }}
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
