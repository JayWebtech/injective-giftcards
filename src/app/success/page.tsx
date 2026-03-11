"use client";

import GiftCard from "@/components/GiftCard";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const COPIED_DURATION_MS = 2500;

function SuccessPageContent() {
  const search = useSearchParams();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedGiftId, setCopiedGiftId] = useState(false);

  const giftId = search.get("giftId") ?? "";
  const claimCode = search.get("claimCode") ?? "";
  const token = (search.get("token") as "INJ" | "USDT") || "USDT";
  const amount = search.get("amount") ?? "0";
  const theme =
    (search.get("theme") as
      | "kente"
      | "sunset"
      | "forest"
      | "ocean"
      | "midnight"
      | "aurora") ?? "kente";
  const senderName = search.get("senderName") ?? "You";
  const message = search.get("message") ?? "Welcome to Injective 🎁";
  const txHash = search.get("txHash") ?? "";

  const usdEquivalent =
    token === "USDT"
      ? `$${Number(amount || "0").toFixed(2)}`
      : `~$${(Number(amount || "0") * 8.5).toFixed(2)}`;

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://giftinj.vercel.app";
  const claimLink = `${baseUrl}/claim?claim=${encodeURIComponent(claimCode)}&giftId=${encodeURIComponent(giftId)}`;

  const tweetText = encodeURIComponent(
    `I just sent a crypto gift card on Injective with GiftINJ! Claim link: ${claimLink} #InjectiveAfrica #GiftINJ #Web3Africa @injectiveafr`,
  );

  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  const copyToClipboard = (value: string, onCopied: () => void) => {
    navigator.clipboard.writeText(value).then(onCopied).catch(() => {});
  };

  const showCopiedCode = () => {
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), COPIED_DURATION_MS);
  };
  const showCopiedLink = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), COPIED_DURATION_MS);
  };
  const showCopiedGiftId = () => {
    setCopiedGiftId(true);
    setTimeout(() => setCopiedGiftId(false), COPIED_DURATION_MS);
  };

  return (
    <div className="mx-auto max-w-[500px] px-5 py-10 text-center">
      <div className="mb-4 text-[56px] animate-pop">🎉</div>
      <h1 className="font-serif text-[32px] font-extrabold">
        Gift Card Created!
      </h1>
      <p className="mt-2 text-sm text-muted">
        Funds are locked in the smart contract. Share the link below.
      </p>

      <div className="mt-8">
        <GiftCard
          token={token}
          amount={amount}
          message={message}
          senderName={senderName}
          theme={theme}
          claimCode={claimCode}
        />
      </div>

      <div className="mt-6 space-y-4 text-left text-xs">
        <div className="glass-surface space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-muted">Gift ID</div>
              <div className="font-mono text-sm text-[#F4A261] break-all">
                {giftId || "—"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(giftId, showCopiedGiftId)}
              className="shrink-0 rounded-[11px] border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold hover:bg-white/20"
            >
              {copiedGiftId ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="glass-surface space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-muted">Claim code</div>
              <div className="font-mono text-sm text-[#F4A261]">
                {claimCode || "XXXX-XXXX-XXXX-XXXX"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(claimCode, showCopiedCode)}
              className="rounded-[11px] border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold hover:bg-white/20"
            >
              {copiedCode ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="glass-surface space-y-3 p-4">
          <div className="flex flex-col gap-2">
            <div className="flex-1">
              <div className="text-muted">Claim link</div>
              <div className="truncate font-mono text-[11px] text-white/80">
                {claimLink}
              </div>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(claimLink, showCopiedLink)}
              className="rounded-[11px] border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold hover:bg-white/20"
            >
              {copiedLink ? "Copied!" : "Copy link"}
            </button>
          </div>
        </div>

        <a
          href={tweetUrl}
          target="_blank"
          rel="noreferrer"
          className="block no-underline"
        >
          <button className="mt-1 w-full rounded-[11px] border border-white/15 bg-black px-4 py-3 text-[14px] font-semibold text-white shadow hover:brightness-110">
            𝕏 Share on X → Win Community Vote
          </button>
        </a>

        {txHash && (
          <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 text-[11px] text-muted">
            <div className="text-muted">Transaction hash</div>
            <div className="font-mono break-all text-white/80">{txHash}</div>
          </div>
        )}

        <div className="mt-2 rounded-xl border border-white/10 bg-black/30 p-3 text-[11px] text-muted">
          <div>
            Network:{" "}
            <span className="font-mono text-white/80">
              Injective Testnet (injective-888)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[500px] px-5 py-10 text-center text-muted">Loading...</div>}>
      <SuccessPageContent />
    </Suspense>
  );
}

