"use client";

import clsx from "clsx";

type Theme = "kente" | "sunset" | "forest" | "ocean" | "midnight" | "aurora";

export interface GiftCardProps {
  token: "INJ" | "USDT";
  amount: string;
  usdValue?: string;
  message: string;
  senderName: string;
  theme: Theme;
  claimCode: string;
  small?: boolean;
}

const themeGradients: Record<Theme, string> = {
  kente:
    "bg-[radial-gradient(circle_at_0%_0%,#5B2C6F_0,#E67E22_40%,#27AE60_100%)]",
  sunset:
    "bg-[radial-gradient(circle_at_0%_0%,#020617_0,#111827_40%,#4C1D95_70%,#F97316_100%)]",
  forest:
    "bg-[radial-gradient(circle_at_0%_0%,#020617_0,#064E3B_45%,#16A34A_80%,#4ADE80_100%)]",
  ocean:
    "bg-[radial-gradient(circle_at_0%_0%,#020617_0,#0F172A_40%,#0E7490_75%,#38BDF8_100%)]",
  midnight:
    "bg-[radial-gradient(circle_at_0%_0%,#050814_0,#1a1a2e_35%,#4C1D95_70%,#E11D48_100%)]",
  aurora:
    "bg-[radial-gradient(circle_at_0%_0%,#020617_0,#0F172A_30%,#4C1D95_65%,#22C55E_100%)]",
};

const themePatterns: Record<Theme, string> = {
  kente: "card-pattern-kente",
  sunset: "card-pattern-sunset",
  forest: "card-pattern-forest",
  ocean: "card-pattern-ocean",
  midnight: "card-pattern-midnight",
  aurora: "card-pattern-aurora",
};

export default function GiftCard({
  token,
  amount,
  message,
  senderName,
  theme,
  claimCode,
  small,
}: GiftCardProps) {
  const partialCode = `${claimCode.slice(0, 9)}•••`;

  const sizeClasses = small
    ? "w-full max-w-xs aspect-[1.386/1] rounded-[14px]"
    : "w-full max-w-lg aspect-[1.586/1] rounded-[20px]";

  const nAmount = Number(amount || "0");
  const usdApprox = (nAmount * (token === "INJ" ? 22 : 1)).toFixed(2);

  return (
    <div
      className={clsx(
        sizeClasses,
        "relative overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.45)] flex-shrink-0 transition-transform duration-300",
        themeGradients[theme],
      )}
    >
      <div
        className={clsx(
          "pointer-events-none absolute inset-0 opacity-60 mix-blend-soft-light",
          themePatterns[theme],
        )}
      />

      <div className="relative z-10 flex h-full flex-col justify-between px-4 py-3 md:px-7 md:py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div
              className={clsx(
                small ? "text-[7px]" : "text-[10px]",
                "font-mono uppercase tracking-[0.3em] text-white/70",
              )}
            >
              Injective Africa
            </div>
            <div
              className={clsx(
                small ? "text-[15px]" : "text-[22px]",
                "font-serif font-extrabold text-white mt-0.5",
              )}
            >
              Gift Card
            </div>
          </div>
          <div className="text-right">
            <div
              className={clsx(
                small ? "text-[18px]" : "text-[28px]",
                "font-mono font-extrabold text-white",
              )}
            >
              {amount}{" "}
              <span
                className={clsx(
                  small ? "text-[9px]" : "text-[13px]",
                  "align-middle font-normal opacity-75",
                )}
              >
                {token}
              </span>
            </div>
            <div
              className={clsx(
                small ? "text-[8px]" : "text-[11px]",
                "font-mono text-white/60 mt-0.5",
              )}
            >
              ≈ ${usdApprox} USD
            </div>
          </div>
        </div>

        {message && (
          <p
            className={clsx(
              small ? "text-[9px]" : "text-[13px]",
              "mt-3 font-serif italic text-center text-white/85 px-2",
            )}
          >
            “{message}”
          </p>
        )}

        <div className="mt-3 flex items-end justify-between text-white/80">
          <div>
            <div
              className={clsx(
                small ? "text-[7px]" : "text-[9px]",
                "font-mono uppercase tracking-[0.2em] text-white/50",
              )}
            >
              From
            </div>
            <div
              className={clsx(
                small ? "text-[11px]" : "text-[14px]",
                "font-semibold",
              )}
            >
              {senderName || "Anonymous"}
            </div>
          </div>
          <div
            className={clsx(
              small ? "px-2 py-0.5" : "px-3 py-1",
              "rounded-md bg-white/15",
            )}
          >
            <div
              className={clsx(
                small ? "text-[7px]" : "text-[10px]",
                "font-mono tracking-[0.08em]",
              )}
            >
              {partialCode}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

