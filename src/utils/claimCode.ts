const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 16;

export function generateClaimCode(): string {
  let raw = "";
  const cryptoObj = window.crypto || (window as any).msCrypto;
  const bytes = new Uint8Array(CODE_LENGTH);
  cryptoObj.getRandomValues(bytes);
  for (let i = 0; i < CODE_LENGTH; i++) {
    raw += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return formatClaimCode(raw);
}

export function formatClaimCode(raw: string): string {
  const cleaned = raw.replace(/[-/\s]/g, "").toUpperCase();
  const chunks: string[] = [];
  for (let i = 0; i < cleaned.length; i += 4) {
    chunks.push(cleaned.slice(i, i + 4));
  }
  return chunks.slice(0, 4).join("-");
}

export async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength
    ) as ArrayBuffer
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

