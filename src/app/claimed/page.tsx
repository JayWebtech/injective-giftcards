"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ClaimedPage() {
  const search = useSearchParams();
  const txHash = search.get("txHash") ?? "";

  return (
    <div className="mx-auto max-w-[480px] px-5 py-10 text-center">
      <div className="mb-3 text-[60px] animate-shine">✨</div>
      <h1 className="font-serif text-[32px] font-extrabold">Gift Claimed!</h1>
      <p className="mt-2 text-sm text-muted">
        Funds have been transferred from the GiftINJ escrow contract to your
        Injective wallet.
      </p>

      <div className="mt-7 glass-surface space-y-3 p-5 text-left text-xs">
        <div className="text-muted">Transaction hash</div>
        <div className="font-mono break-all text-xs text-white/85">
          {txHash || "Available when arriving from a claim flow."}
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-xs md:grid-cols-2">
        <a
          href="https://injective.com"
          target="_blank"
          rel="noreferrer"
          className="primary-gradient inline-flex items-center justify-center rounded-[11px] px-4 py-2 font-semibold text-black shadow hover:brightness-110"
        >
          Explore Injective DeFi →
        </a>
        <Link
          href="/create"
          className="inline-flex items-center justify-center rounded-[11px] border border-white/20 px-4 py-2 font-semibold text-white hover:bg-white/5"
        >
          Send a Gift Card to Someone 🎁
        </Link>
      </div>
    </div>
  );
}

