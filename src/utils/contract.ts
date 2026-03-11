"use client";

import { CONTRACT_ADDRESS, TESTNET_CHAIN_ID } from "@/constants";
import { formatClaimCode } from "@/utils/claimCode";

export interface CreateGiftArgs {
  senderAddress: string;
  giftId: string;
  claimCodeHash: string;
  recipientHint?: string;
  amount: string;
  denom: string;
}

export interface ClaimGiftArgs {
  claimerAddress: string;
  giftId: string;
  claimCode: string;
}

// Injective SDK: use REST + createTransaction + Keplr sign/broadcast to avoid EthAccount decode
import { Network, getNetworkEndpoints } from "@injectivelabs/networks";
import { ChainRestAuthApi, ChainRestTendermintApi } from "@injectivelabs/sdk-ts/client/chain";
import { BaseAccount } from "@injectivelabs/sdk-ts/core/accounts";
import {
  createTransaction,
  getTxRawFromTxRawOrDirectSignResponse,
  TxRestApi,
  BroadcastModeKeplr,
} from "@injectivelabs/sdk-ts/core/tx";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { MsgExecuteContractCompat } from "@injectivelabs/sdk-ts/core/modules";
import {
  toBigNumber,
  getStdFee,
  DEFAULT_BLOCK_TIMEOUT_HEIGHT,
} from "@injectivelabs/utils";

const NETWORK = Network.Testnet;
const ENDPOINTS = getNetworkEndpoints(NETWORK);
const REST_URL = ENDPOINTS.rest ?? "https://testnet.sentry.lcd.injective.network:443";

/** Map contract/chain error messages to user-friendly text */
export function parseContractError(message: string): string {
  if (!message || typeof message !== "string") return "Transaction failed";
  const m = message.toLowerCase();
  if (m.includes("gift not found")) return "Gift not found. Check the Gift ID and try again.";
  if (m.includes("invalid claim code")) return "Invalid claim code. Please check the code and try again.";
  if (m.includes("already claimed")) return "This gift has already been claimed.";
  if (m.includes("already refunded")) return "This gift was refunded by the sender.";
  if (m.includes("cannot claim own gift")) return "You cannot claim a gift you sent. Share the link with the recipient.";
  if (m.includes("unauthorized")) return "You are not authorized to perform this action.";
  if (m.includes("insufficient") || m.includes("amount too small")) return "Insufficient amount or invalid token.";
  if (m.includes("no funds")) return "No funds were sent with the transaction.";
  // raw_log can be JSON string (array of events); try to extract contract error from it
  try {
    const parsed = JSON.parse(message);
    const log = Array.isArray(parsed) ? parsed[0] : parsed;
    const logStr = typeof log === "string" ? log : log?.message ?? JSON.stringify(log);
    if (logStr && typeof logStr === "string" && logStr.length < 500) {
      const lower = logStr.toLowerCase();
      if (lower.includes("gift not found")) return "Gift not found. Check the Gift ID and try again.";
      if (lower.includes("invalid claim code")) return "Invalid claim code. Please check the code and try again.";
      const afterFail = /(?:execute contract failed|failed to execute[^:]*):\s*(.+)/i.exec(logStr);
      if (afterFail?.[1]) return afterFail[1].trim();
      return logStr;
    }
  } catch {
    // not JSON, fall through
  }
  // Try to extract after "execute contract failed" or "failed to execute"
  const contractFail = /(?:execute contract failed|failed to execute[^:]*):\s*([\s\S]+?)(?:$|")/i.exec(message);
  if (contractFail?.[1]) return contractFail[1].trim();
  // Often raw_log is like: "failed to execute message; message index: 0: ..."
  const msgIndex = /message index: \d+: (.+?)(?:;|$)/i.exec(message);
  if (msgIndex?.[1]) return msgIndex[1].trim();
  return message;
}

async function getKeplr() {
  const w = typeof window !== "undefined" ? (window as any).keplr : undefined;
  if (!w) throw new Error("Keplr extension not found");
  await w.enable(TESTNET_CHAIN_ID);
  return w;
}

async function getInjectiveAddressAndPubKey(): Promise<{
  injectiveAddress: string;
  pubKeyBase64: string;
}> {
  const keplr = await getKeplr();
  const key = await keplr.getKey(TESTNET_CHAIN_ID);
  const pubKeyBase64 =
    key.pubKey && key.pubKey.length
      ? Buffer.from(key.pubKey).toString("base64")
      : "";
  return {
    injectiveAddress: key.bech32Address,
    pubKeyBase64,
  };
}

async function fetchBaseAccount(injectiveAddress: string) {
  const api = new ChainRestAuthApi(REST_URL);
  const res = await api.fetchAccount(injectiveAddress);
  return BaseAccount.fromRestApi(res);
}

async function signAndBroadcast(
  signDoc: ReturnType<typeof createTransaction>["signDoc"],
  injectiveAddress: string
): Promise<{ transactionHash: string }> {
  const keplr = await getKeplr();
  const offlineSigner = keplr.getOfflineSigner(TESTNET_CHAIN_ID);
  const directSignResponse = await offlineSigner.signDirect(
    injectiveAddress,
    // Keplr's signDirect type comes from its injected API; cast to any to avoid extra type deps.
    signDoc as any
  );
  const txRaw = getTxRawFromTxRawOrDirectSignResponse(directSignResponse);
  const result = await keplr.sendTx(
    TESTNET_CHAIN_ID,
    TxRaw.encode(txRaw).finish(),
    BroadcastModeKeplr.Sync
  );
  if (!result || result.length === 0) {
    throw new Error("Transaction failed to be broadcast");
  }
  const txHash = Buffer.from(result).toString("hex");
  const txApi = new TxRestApi(REST_URL);
  const response = await txApi.fetchTxPoll(txHash);
  return {
    transactionHash: response.txHash || txHash,
  };
}

export async function executeCreateGift(args: CreateGiftArgs) {
  const {
    senderAddress,
    giftId,
    claimCodeHash,
    recipientHint,
    amount,
    denom,
  } = args;

  const { injectiveAddress, pubKeyBase64 } =
    await getInjectiveAddressAndPubKey();
  if (injectiveAddress !== senderAddress) {
    throw new Error("Sender address does not match connected wallet");
  }

  const baseAccount = await fetchBaseAccount(senderAddress);
  const tendermintApi = new ChainRestTendermintApi(REST_URL);
  const latestBlock = await tendermintApi.fetchLatestBlock();
  const latestHeight = latestBlock.header.height;
  const timeoutHeight = toBigNumber(latestHeight)
    .plus(DEFAULT_BLOCK_TIMEOUT_HEIGHT)
    .toNumber();

  const msg = MsgExecuteContractCompat.fromJSON({
    contractAddress: CONTRACT_ADDRESS,
    sender: senderAddress,
    msg: {
      create_gift: {
        gift_id: giftId,
        claim_code_hash: claimCodeHash,
        recipient_hint: recipientHint ?? null,
      },
    },
    funds: [{ denom, amount }],
  });

  const { signDoc } = createTransaction({
    pubKey: pubKeyBase64,
    chainId: TESTNET_CHAIN_ID,
    fee: getStdFee({}),
    message: msg,
    sequence: baseAccount.sequence,
    timeoutHeight,
    accountNumber: baseAccount.accountNumber,
  });

  return signAndBroadcast(signDoc, senderAddress);
}

export async function executeClaimGift(args: ClaimGiftArgs) {
  const { claimerAddress, giftId, claimCode } = args;
  // Contract hashes the exact string stored at create time (formatted with dashes).
  const normalizedCode = formatClaimCode(claimCode);
  const cleaned = normalizedCode.replace(/-/g, "");
  if (cleaned.length !== 16) {
    throw new Error(
      "Claim code must be exactly 16 characters (e.g. XXXX-XXXX-XXXX-XXXX). Please check the code from the sender."
    );
  }
  if (!giftId.trim()) {
    throw new Error("Gift ID is required. Get it from the sender or the claim link.");
  }

  const { injectiveAddress, pubKeyBase64 } =
    await getInjectiveAddressAndPubKey();
  if (injectiveAddress !== claimerAddress) {
    throw new Error("Claimer address does not match connected wallet");
  }

  const baseAccount = await fetchBaseAccount(claimerAddress);
  const tendermintApi = new ChainRestTendermintApi(REST_URL);
  const latestBlock = await tendermintApi.fetchLatestBlock();
  const latestHeight = latestBlock.header.height;
  const timeoutHeight = toBigNumber(latestHeight)
    .plus(DEFAULT_BLOCK_TIMEOUT_HEIGHT)
    .toNumber();

  const msg = MsgExecuteContractCompat.fromJSON({
    contractAddress: CONTRACT_ADDRESS,
    sender: claimerAddress,
    msg: {
      claim_gift: {
        gift_id: giftId,
        claim_code: normalizedCode,
      },
    },
  });

  const { signDoc } = createTransaction({
    pubKey: pubKeyBase64,
    chainId: TESTNET_CHAIN_ID,
    fee: getStdFee({}),
    message: msg,
    sequence: baseAccount.sequence,
    timeoutHeight,
    accountNumber: baseAccount.accountNumber,
  });

  return signAndBroadcast(signDoc, claimerAddress);
}
