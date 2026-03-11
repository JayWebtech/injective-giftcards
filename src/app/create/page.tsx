"use client";

import { useMemo, useState } from "react";
import Steps from "@/components/Steps";
import GiftCard from "@/components/GiftCard";
import { DENOM_INJ, DENOM_USDT, PLATFORM_FEE_BPS } from "@/constants";
import { useKeplr } from "@/hooks/useKeplr";
import { executeCreateGift } from "@/utils/contract";
import { generateClaimCode, sha256Hex } from "@/utils/claimCode";
import { useRouter } from "next/navigation";

type Token = "INJ" | "USDT";
type Theme = "kente" | "sunset" | "forest" | "ocean" | "midnight" | "aurora";

export default function CreatePage() {
  const router = useRouter();
  const { address, isConnected, connect, loading: walletLoading, error } =
    useKeplr();

  const [step, setStep] = useState(1);
  const [token, setToken] = useState<Token>("USDT");
  const [amount, setAmount] = useState<string>("5");
  const [theme, setTheme] = useState<Theme>("kente");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("Welcome to Injective 🎁");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const usdEquivalent = useMemo(() => {
    if (!amount || Number.isNaN(Number(amount))) return "";
    // Simple assumption: 1 USDT = 1 USD, 1 INJ ~ 8.5 USD for display only.
    const n = Number(amount);
    if (token === "USDT") return `$${n.toFixed(2)}`;
    return `~$${(n * 8.5).toFixed(2)}`;
  }, [amount, token]);

  const parsedAmount = useMemo(() => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return null;
    if (token === "USDT") {
      return Math.round(n * 1_000_000).toString();
    }
    // INJ 18 decimals: 6 from JS rounding, +12 as string to avoid precision issues
    return Math.round(n * 1e6).toString() + "000000000000";
  }, [amount, token]);

  const feeFraction = PLATFORM_FEE_BPS / 10_000;
  const receiverAmountDisplay = useMemo(() => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return "";
    const afterFee = n * (1 - feeFraction);
    if (token === "USDT") return `${afterFee.toFixed(2)} USDT`;
    return `${afterFee.toFixed(4)} INJ`;
  }, [amount, feeFraction, token]);

  const canProceedStep1 = !!parsedAmount;

  async function handleSubmit() {
    if (!address) {
      await connect();
      return;
    }
    if (!parsedAmount) return;

    try {
      setSubmitting(true);
      setTxError(null);

      const rawClaimCode = generateClaimCode();
      const claimCodeHash = await sha256Hex(rawClaimCode);
      const giftId = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

      const denom = token === "INJ" ? DENOM_INJ : DENOM_USDT;

      const result = await executeCreateGift({
        senderAddress: address,
        giftId,
        claimCodeHash,
        recipientHint: recipientEmail || undefined,
        amount: parsedAmount,
        denom,
      });

      const txHash = result.transactionHash ?? "";

      const params = new URLSearchParams({
        giftId,
        claimCode: rawClaimCode,
        token,
        amount,
        theme,
        senderName,
        message,
        txHash,
      });

      router.push(`/success?${params.toString()}`);
    } catch (e: any) {
      console.error(e);
      setTxError(e?.message ?? "Failed to create gift");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <section className="pt-8">
        <h1 className="font-serif text-[32px] font-extrabold">
          Create Gift Card
        </h1>
        <p className="mt-1 text-sm text-muted mb-5">
          Design your card and lock funds in the CosmWasm escrow contract.
        </p>
        <Steps current={step} steps={["Design", "Message", "Confirm"]} />
      </section>

      <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-start">
        <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl md:p-6">
          {step === 1 && (
            <>
              <h2 className="font-medium">Step 1 – Design</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-mono font-semibold uppercase tracking-[0.16em] text-muted">
                    Token
                  </div>
                  <div className="mt-1 flex gap-3">
                    {(["USDT", "INJ"] as Token[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setToken(t)}
                        className={`flex-1 rounded-[20px] px-5 py-3 text-sm font-semibold transition-colors ${
                          token === t
                            ? "bg-[rgba(230,57,70,0.18)] text-[#F87171] outline outline-1 outline-[rgba(230,57,70,0.35)]"
                            : "bg-white/5 text-white/60 outline outline-1 outline-white/10 hover:bg-white/10"
                        }`}
                      >
                        {t === "USDT" ? "USDT" : "INJ"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono font-semibold uppercase tracking-[0.16em] text-muted">
                    Amount ({token})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-[11px] border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none ring-0 focus:border-[#F4A261]"
                    placeholder={token === "USDT" ? "5.00" : "0.10"}
                  />
                  <div className="flex flex-col gap-0.5 text-xs text-muted">
                    <span>Recipient gets (after 2% fee):</span>
                    <span className="font-mono text-[11px] text-white">
                      {receiverAmountDisplay || "-"}
                    </span>
                  </div>
                  <div className="text-xs text-muted">
                    Minimum: 1 USDT or 0.1 INJ. Zero gas fees on Injective make
                    small gifts viable.
                  </div>
                </div>

              <div className="space-y-2">
                <div className="text-xs font-mono font-semibold uppercase tracking-[0.16em] text-muted">
                  Card theme
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {(
                    [
                      {
                        id: "kente",
                        label: "Kente",
                        colors: ["#E67E22", "#E63946", "#27AE60"],
                      },
                      {
                        id: "sunset",
                        label: "Sunset",
                        colors: ["#FF6B35", "#FF9F1C", "#FFBE0B"],
                      },
                      {
                        id: "forest",
                        label: "Forest",
                        colors: ["#1B4332", "#40916C", "#95D5B2"],
                      },
                      {
                        id: "ocean",
                        label: "Ocean",
                        colors: ["#03045E", "#0077B6", "#90E0EF"],
                      },
                      {
                        id: "midnight",
                        label: "Midnight",
                        colors: ["#0D0D0D", "#E63946", "#4C1D95"],
                      },
                      {
                        id: "aurora",
                        label: "Aurora",
                        colors: ["#0EA5E9", "#22C55E", "#A855F7"],
                      },
                    ] as {
                      id: Theme;
                      label: string;
                      colors: string[];
                    }[]
                  ).map((option) => {
                    const isActive = theme === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setTheme(option.id)}
                        className={`inline-flex min-w-[140px] items-center justify-between rounded-2xl border px-3.5 py-2.5 text-xs font-medium transition-colors ${
                          isActive
                            ? "border-[#F87171] bg-[rgba(248,113,113,0.18)] text-white shadow-[0_0_0_1px_rgba(248,113,113,0.25)]"
                            : "border-white/10 bg-black/40 text-white/60 hover:border-white/30 hover:bg-white/5"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5">
                            {option.colors.map((c) => (
                              <span
                                key={c}
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </span>
                          <span className="tracking-wide">
                            {option.label}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-medium">Step 2 – Message</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono font-semibold uppercase tracking-[0.16em] text-muted">
                    Your name (shown on card)
                  </label>
                  <input
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Ama from Accra"
                    className="w-full rounded-[11px] border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#F4A261]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono font-semibold uppercase tracking-[0.16em] text-muted">
                    Personal message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full rounded-[11px] border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#F4A261]"
                    placeholder="Welcome to Web3 on Injective..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono font-semibold uppercase tracking-[0.16em] text-muted">
                    Recipient email (optional)
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="friend@example.com"
                    className="w-full rounded-[11px] border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#F4A261]"
                  />
                  <p className="text-xs text-muted">
                    This is stored as a simple hint in the contract state so you
                    remember who the gift was for.
                  </p>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-medium">Step 3 – Confirm</h2>
              <div className="space-y-4 text-sm">
                <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">Token</span>
                    <span className="font-mono text-white">
                      {token === "USDT" ? "USDT (peggy)" : "INJ"}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-muted">Gift amount</span>
                    <span className="font-mono text-white">
                      {amount || "-"} {token}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-muted">Platform fee (2%)</span>
                    <span className="font-mono text-white/80">
                      {(Number(amount || "0") * feeFraction).toFixed(2)} {token}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-muted">Recipient receives</span>
                    <span className="font-mono text-[#6FCFB0]">
                      {receiverAmountDisplay || "-"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#F4A261]">
                  Funds are locked in a CosmWasm escrow contract on Injective
                  until the recipient claims or you refund.
                </p>
                <p className="text-xs text-muted">
                  You will sign a single MsgExecuteContract transaction in
                  Keplr. Recipient never pays gas to claim.
                </p>
              </div>
            </>
          )}

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="text-xs text-muted hover:text-white disabled:opacity-40"
            >
              Back
            </button>
            <div className="flex items-center gap-3">
              {error && (
                <span className="text-xs text-red-400 max-w-[200px]">
                  {error}
                </span>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  disabled={step === 1 && !canProceedStep1}
                  onClick={() => setStep((s) => Math.min(3, s + 1))}
                  className="primary-gradient inline-flex items-center justify-center rounded-[11px] px-5 py-2 text-xs font-semibold text-black shadow hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !canProceedStep1}
                  className="primary-gradient inline-flex items-center justify-center rounded-[11px] px-5 py-2 text-xs font-semibold text-black shadow hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? "Locking funds via Keplr..."
                    : isConnected
                      ? "Lock & Create Card"
                      : walletLoading
                        ? "Connecting Keplr..."
                        : "Connect Keplr & Create"}
                </button>
              )}
            </div>
          </div>
          {txError && (
            <div className="mt-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              {txError}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <GiftCard
            token={token}
            amount={amount || "0"}
            usdValue={usdEquivalent}
            message={message}
            senderName={senderName || "You"}
            theme={theme}
            claimCode="XXXX-XXXX-XXXX-XXXX"
          />
          <p className="text-xs text-muted">
            This is a live preview. Your actual claim code will be generated
            client-side and only its SHA-256 hash is stored in the contract.
          </p>
        </div>
      </div>
    </div>
  );
}

