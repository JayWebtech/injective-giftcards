"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useKeplr } from "@/hooks/useKeplr";
import { executeClaimGift, parseContractError } from "@/utils/contract";
import Link from "next/link";

function ClaimPageContent() {
  const search = useSearchParams();
  const initialCode = search.get("claim") ?? "";
  const initialGiftId = search.get("giftId") ?? "";

  const { address, isConnected, connect, loading: walletLoading } = useKeplr();

  const [claimCode, setClaimCode] = useState(initialCode);
  const [giftId, setGiftId] = useState(initialGiftId);
  const [manualAddress, setManualAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (initialCode) setClaimCode(initialCode);
    if (initialGiftId) setGiftId(initialGiftId);
  }, [initialCode, initialGiftId]);

  const effectiveAddress = useMemo(
    () => manualAddress || address || "",
    [manualAddress, address],
  );

  async function handleClaim() {
    try {
      setSubmitting(true);
      setTxError(null);
      setTxHash(null);

      const claimer = effectiveAddress;
      if (!claimer) {
        await connect();
        return;
      }
      if (!giftId || !claimCode) {
        setTxError("Please enter both gift ID and claim code.");
        return;
      }

      const result = await executeClaimGift({
        claimerAddress: claimer,
        giftId,
        claimCode,
      });

      setTxHash(result.transactionHash ?? "");
    } catch (e: any) {
      console.error(e);
      const msg = e?.message ?? "Failed to claim gift";
      setTxError(parseContractError(msg));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[440px] px-5 py-10 text-center">
      <div className="mb-3 text-[48px]">🎁</div>
      <h1 className="font-serif text-[32px] font-extrabold">Claim Your Gift</h1>
      <p className="mt-2 text-sm text-muted">
        Enter your claim code to receive crypto — no experience needed.
      </p>

      <div className="mt-8 glass-surface space-y-5 p-5 md:p-6 text-left">
        <div className="space-y-2">
          <label className="text-xs font-mono font-semibold uppercase tracking-[0.16em] text-muted">
            Claim code
          </label>
          <input
            value={claimCode}
            onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            className="w-full rounded-[11px] border border-white/15 bg-white/5 px-3 py-2 font-mono text-sm outline-none focus:border-[#F4A261]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono font-semibold uppercase tracking-[0.16em] text-muted">
            Gift ID
          </label>
          <input
            value={giftId}
            onChange={(e) => setGiftId(e.target.value)}
            placeholder="Provided by the sender or explorer"
            className="w-full rounded-[11px] border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#F4A261]"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Injective wallet address</span>
            {address && (
              <span className="font-mono text-[11px] text-white/80">
                Connected: {address.slice(0, 8)}…{address.slice(-6)}
              </span>
            )}
          </div>
          <input
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            placeholder="inj1..."
            className="w-full rounded-[11px] border border-white/15 bg-white/5 px-3 py-2 font-mono text-sm outline-none focus:border-[#F4A261]"
          />
          <p className="text-[11px] text-muted">
            You can either paste an Injective address manually or connect Keplr
            and leave this field empty.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClaim}
          disabled={submitting}
          className="primary-gradient inline-flex w-full items-center justify-center rounded-[11px] px-5 py-3 text-sm font-semibold text-black shadow hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? "Broadcasting claim transaction..."
            : !effectiveAddress && !isConnected && !manualAddress
              ? walletLoading
                ? "Connecting Keplr..."
                : "Connect Keplr or enter address"
              : "Claim my gift"}
        </button>

        {txError && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            {txError}
          </div>
        )}

        {txHash && (
          <div className="rounded-lg border border-[#6FCFB0]/40 bg-[#6FCFB0]/10 px-3 py-2 text-xs text-[#e8fff8]">
            <div className="font-semibold">Success!</div>
            <div className="mt-1">
              Tx hash:
              <span className="ml-1 font-mono break-all text-white/90">
                {txHash}
              </span>
            </div>
            <div className="mt-2">
              <Link
                href={`/claimed?txHash=${encodeURIComponent(txHash)}`}
                className="underline underline-offset-2"
              >
                View claimed receipt
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-muted text-left">
        <p>
          No wallet yet? Create one for free at{" "}
          <a
            href="https://injective.com"
            target="_blank"
            rel="noreferrer"
            className="text-[#F4A261] underline-offset-2 hover:underline"
          >
            injective.com
          </a>
          . Then come back to paste your new address.
        </p>
      </div>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={<ClaimPageFallback />}>
      <ClaimPageContent />
    </Suspense>
  );
}

function ClaimPageFallback() {
  return (
    <div className="mx-auto max-w-[440px] px-5 py-10 text-center">
      <div className="mb-3 text-[48px]">🎁</div>
      <h1 className="font-serif text-[32px] font-extrabold">Claim Your Gift</h1>
      <p className="mt-2 text-sm text-muted">Loading...</p>
    </div>
  );
}

