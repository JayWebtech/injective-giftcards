import Link from "next/link";
import GiftCard from "@/components/GiftCard";

const DEMO_CARDS = [
  {
    id: "d1",
    token: "USDT" as const,
    amount: "25",
    message: "Happy Birthday! 🎉",
    senderName: "Chidi",
    theme: "midnight" as const,
    claimCode: "DEMO-XXXX-XXXX-0001",
  },
  {
    id: "d2",
    token: "INJ" as const,
    amount: "2",
    message: "Welcome to Web3 🌍",
    senderName: "Amara",
    theme: "forest" as const,
    claimCode: "DEMO-XXXX-XXXX-0002",
  },
  {
    id: "d3",
    token: "USDT" as const,
    amount: "50",
    message: "Congrats on graduating!",
    senderName: "Fatima",
    theme: "ocean" as const,
    claimCode: "DEMO-XXXX-XXXX-0003",
  },
];

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-black text-white">
      <div className="mx-auto max-w-[860px] px-5 pb-16 pt-10">
        {/* Hero */}
        <section className="py-16 text-center">
          <h1 className="mb-5 font-serif text-[clamp(36px,7vw,66px)] font-extrabold leading-tight">
            Send Crypto as a
            <br />
            <span className="text-orange-500">
              Gift Card
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-[420px] text-[17px] leading-relaxed text-muted">
            Load USDT or INJ onto a beautiful card. Share a link. Anyone can
            claim — no wallet needed to receive.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/create"
              className="inline-flex items-center justify-center rounded-[11px] bg-orange-500 px-6 py-3 text-[15px] font-semibold text-black shadow-[0_4px_18px_rgba(230,57,70,0.28)] hover:opacity-90"
            >
              Create Gift Card
            </Link>
            <Link
              href="/claim"
              className="inline-flex items-center justify-center rounded-[11px] border border-white/15 bg-white/5 px-5 py-2.5 text-[15px] font-semibold text-white hover:bg-white/10"
            >
              Claim a Gift
            </Link>
          </div>
        </section>

        {/* Floating demo cards */}
        <section className="mb-16 flex flex-wrap justify-center gap-5">
          {DEMO_CARDS.map((card, i) => (
            <div
              key={card.id}
              className={`w-[220px] ${
                i === 0
                  ? "animate-float0"
                  : i === 1
                    ? "animate-float1"
                    : "animate-float2"
              }`}
            >
              <GiftCard
                small
                token={card.token}
                amount={card.amount}
                message={card.message}
                senderName={card.senderName}
                theme={card.theme}
                claimCode={card.claimCode}
              />
            </div>
          ))}
        </section>

        {/* How it works */}
        <section className="mb-16 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              icon: "💳",
              title: "Design Your Card",
              body:
                "Pick a theme, choose USDT or INJ, write a personal message.",
            },
            {
              icon: "🔗",
              title: "Share a Link",
              body:
                "Get a unique claim link to share on WhatsApp, X, or anywhere.",
            },
            {
              icon: "🎁",
              title: "They Claim It",
              body:
                "Recipient pastes their wallet address — funds arrive instantly.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white/5 rounded-[11px] border border-white/10 text-center px-5 py-6"
            >
              <div className="mb-2 text-3xl">{item.icon}</div>
              <div className="mb-1 font-bold text-[16px]">
                {item.title}
              </div>
              <div className="text-[13px] leading-relaxed text-muted">
                {item.body}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
