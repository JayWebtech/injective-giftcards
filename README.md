# GiftINJ

Send INJ or USDT on Injective as shareable gift cards. Funds are locked in a CosmWasm escrow; the recipient redeems with a claim code and their wallet address.

**Important:** A gift cannot be redeemed by the wallet that created it. Only someone else can claim it.

---

## Stack

- **Contract:** CosmWasm (Rust) – `contracts/gift-escrow`
- **Network:** Injective Testnet (`injective-888`)
- **Frontend:** Next.js (App Router) + Tailwind v4
- **Wallet:** Keplr  
- **RPC:** `https://testnet.sentry.tm.injective.network:443`

---

## Contract

**Location:** `contracts/gift-escrow`

| Message      | Description |
|-------------|-------------|
| `CreateGift` | Lock funds in escrow (min 1 USDT or 0.1 INJ). |
| `ClaimGift`  | Redeem with claim code; sends funds to claimer. **Cannot be called by the creator wallet.** |
| `RefundGift` | Creator only; refund when pending or after 30 days. |
| `GetGift` / `ListGiftsBySender` | Queries. |

**Build:**

```bash
cd contracts/gift-escrow
cargo wasm
```

**Optimized build (Docker):**

```bash
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/rust-optimizer:0.14.0
```

Output: `artifacts/gift_escrow.wasm`

**Deploy (Injective Testnet):**

```bash
injectived tx wasm store artifacts/gift_escrow.wasm --from <keyname> --chain-id injective-888 --gas auto --gas-adjustment 1.4
# Use returned code_id:
injectived tx wasm instantiate <code_id> '{}' --label "giftinj-escrow" --from <keyname> --no-admin --chain-id injective-888 --gas auto --gas-adjustment 1.4
```

Set the contract address in `src/constants.ts`:

```ts
export const CONTRACT_ADDRESS = "inj1...";
```

---

## Frontend

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Route      | Purpose |
|-----------|---------|
| `/`       | Home – create or claim a gift. |
| `/create` | Create gift: token, amount, theme, message, then lock via Keplr. |
| `/success` | After create: claim code, link, share. |
| `/claim`  | Enter code + gift ID + Injective address; claim via Keplr. **Use a different wallet than the creator.** |
| `/claimed` | Claim success receipt. |

Claim codes: 16 chars, `XXXX-XXXX-XXXX-XXXX`. Only the hash is stored on-chain; the raw code is shared with the recipient.

---

## Deploy frontend

Build and deploy (e.g. Vercel): `npm run build`. Ensure `CONTRACT_ADDRESS` in `src/constants.ts` is set for the target environment.
