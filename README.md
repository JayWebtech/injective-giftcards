# GiftINJ – Crypto Gift Cards on Injective

GiftINJ lets you wrap INJ or USDT on Injective into beautiful, shareable crypto gift cards. Funds are locked in a CosmWasm escrow contract and redeemed with a simple claim code and Injective address.

## Stack

inj13y5qz04vzve43pp5f55s34qgxfhkze37xzwgrw

- **Smart contract**: CosmWasm (Rust) – `contracts/gift-escrow`
- **Network**: Injective Testnet (`injective-888`)
- **Frontend**: Next.js (App Router) + Tailwind v4
- **Wallet**: Keplr browser extension
- **RPC**: `https://testnet.sentry.tm.injective.network:443`

## Contract

Location: `contracts/gift-escrow`

### Messages

- **Execute**
  - `CreateGift { gift_id, claim_code_hash, recipient_hint }` – locks sent funds in escrow
  - `ClaimGift { gift_id, claim_code }` – verifies SHA-256 claim code, sends funds to claimer
  - `RefundGift { gift_id }` – sender-only, refundable when pending or after 30 days
- **Query**
  - `GetGift { gift_id }`
  - `ListGiftsBySender { sender }`

Validation rules match the spec: minimum 1 USDT or 0.1 INJ, non-empty claim hash, cannot claim your own gift.

### Build and optimize
39287
From repo root:

```bash
cd contracts/gift-escrow
cargo wasm
```

For production you should use the CosmWasm optimizer (Docker):

```bash
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/rust-optimizer:0.14.0
```

This will output an optimized `.wasm` in `artifacts/`.

### Deploy to Injective Testnet

Using `injectived` (pseudo-commands – adjust flags and key names as needed):

```bash
injectived tx wasm store artifacts/gift_escrow.wasm \
  --from <keyname> --chain-id injective-888 --gas auto --gas-adjustment 1.4

# Note the returned code_id, then:
injectived tx wasm instantiate <code_id> '{}' \
  --label "giftinj-escrow" --from <keyname> --no-admin \
  --chain-id injective-888 --gas auto --gas-adjustment 1.4
```

Copy the instantiated **contract address** and paste it into `src/constants.ts`:

```ts
export const CONTRACT_ADDRESS = "inj1..."; // your deployed instance
```

## Frontend

Location: `src/app` (Next.js App Router) and `src/components`, `src/hooks`, `src/utils`.

### Install and run

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

### Keplr + Injective

The frontend integrates with Keplr using `window.keplr`:

- Chain ID: `injective-888`
- RPC: `https://testnet.sentry.tm.injective.network:443`

The `useKeplr` hook handles:

- Prompting Keplr connection
- Reading the Injective address
- Auto-reconnecting on reload

Contract execution is done with `@cosmjs/cosmwasm-stargate` via helpers in `src/utils/contract.ts`:

- `executeCreateGift` – wraps `MsgExecuteContract` with `CreateGift{}` and funds
- `executeClaimGift` – wraps `MsgExecuteContract` with `ClaimGift{}`

### Claim codes

Implemented in `src/utils/claimCode.ts`:

- 16-char codes from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
- Formatted as `XXXX-XXXX-XXXX-XXXX`
- On creation, the raw code is SHA-256 hashed in the browser and only the **hex hash** is sent to the contract
- On claim, the raw code is sent to the contract and verified against the stored hash

### Main flows

- `/` – **Home**
  - Hero “Send crypto as a gift card”
  - Floating animated demo cards
  - CTAs: **Create Gift Card**, **Claim a Gift**
  - “How it works” 3-step section

- `/create` – **3-step wizard**
  - Step 1 – Design: token (INJ/USDT), amount, theme picker, live preview
  - Step 2 – Message: sender name, personal message, optional recipient email
  - Step 3 – Confirm & Lock: fee breakdown (2% platform fee), escrow warning, Keplr signing
  - On success: navigates to `/success` with query params for card rendering

- `/success` – **Creation success**
  - Celebration animation
  - Full gift card render
  - Claim code + copy
  - Claim link + copy
  - Share on X button with hashtags `#InjectiveAfrica #GiftINJ #Web3Africa`
  - Shows transaction hash and gift ID

- `/claim` – **Claim page**
  - Accepts `?claim=CODE` to auto-fill claim code
  - Inputs: claim code, gift ID, Injective address (or connect Keplr)
  - Executes `ClaimGift{}` via Keplr
  - On success, shows tx hash and link to `/claimed`

- `/claimed` – **Claimed success**
  - Simple receipt view with tx hash
  - CTAs: “Explore Injective DeFi” and “Send a Gift Card to Someone”

## Hackathon notes

To pitch/demo:

- Emphasize **zero gas for recipients** and how this enables very small on-chain gifts (e.g. $1–5 trials)
- Show full flow:
  1. Connect Keplr, create a gift with a message
  2. Copy claim link into a new browser/profile
  3. Paste claim code, connect / paste wallet, claim
  4. Show wallet balance increase and transaction on explorer
- Highlight the UX:
  - Familiar gift-card visual
  - Simple link-based sharing
  - No Web3 friction for recipients beyond providing an address

You can deploy the frontend to Vercel/Netlify with the standard Next.js workflow (`npm run build`) once the contract address is configured.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
