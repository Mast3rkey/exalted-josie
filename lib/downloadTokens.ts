import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

/**
 * DOWNLOAD_SECRET must be set in .env.local
 * Used to sign tokens so they can't be forged.
 */
const SECRET = process.env.DOWNLOAD_SECRET;
if (!SECRET) {
  throw new Error("DOWNLOAD_SECRET is not set in environment variables");
}
const SECRET_KEY: string = SECRET;

type TokenRecord = {
  tokenId: string;
  stripeSessionId: string;
  customerEmail: string | null;
  createdAt: number; // unix ms
  expiresAt: number; // unix ms
  maxDownloads: number;
  downloadsUsed: number;
};

type TokenStore = {
  version: 1;
  tokens: Record<string, TokenRecord>;
};

const STORE_PATH = path.join(process.cwd(), "private_downloads", "tokens.json");

async function readStore(): Promise<TokenStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as TokenStore;
    if (!parsed || parsed.version !== 1 || !parsed.tokens) throw new Error("bad store");
    return parsed;
  } catch {
    return { version: 1, tokens: {} };
  }
}

async function writeStore(store: TokenStore): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  const tmp = STORE_PATH + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tmp, STORE_PATH);
}

function sign(tokenId: string): string {
  return crypto.createHmac("sha256", SECRET_KEY).update(tokenId).digest("hex");
}

/**
 * Token format: base64url("tokenId.signature")
 */
export function encodeToken(tokenId: string): string {
  const signature = sign(tokenId);
  return Buffer.from(`${tokenId}.${signature}`).toString("base64url");
}

export function decodeToken(token: string): { tokenId: string; signature: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(".");
    if (parts.length !== 2) return null;
    const [tokenId, signature] = parts;
    if (!tokenId || !signature) return null;
    return { tokenId, signature };
  } catch {
    return null;
  }
}

export function verifyTokenSignature(token: string): string | null {
  const parts = decodeToken(token);
  if (!parts) return null;

  const expected = sign(parts.tokenId);
  if (parts.signature !== expected) return null;

  return parts.tokenId;
}

export async function issueDownloadToken(args: {
  stripeSessionId: string;
  customerEmail: string | null;
  hoursValid: number; // e.g. 72
  maxDownloads: number; // e.g. 3
}): Promise<string> {
  const now = Date.now();
  const expiresAt = now + args.hoursValid * 60 * 60 * 1000;

  const tokenId = crypto.randomBytes(24).toString("hex");

  const record: TokenRecord = {
    tokenId,
    stripeSessionId: args.stripeSessionId,
    customerEmail: args.customerEmail ?? null,
    createdAt: now,
    expiresAt,
    maxDownloads: Math.max(1, args.maxDownloads),
    downloadsUsed: 0,
  };

  const store = await readStore();
  store.tokens[tokenId] = record;
  await writeStore(store);

  return encodeToken(tokenId);
}

/**
 * Validates and consumes 1 download.
 * Returns the record if allowed, otherwise null.
 */
export async function consumeDownloadToken(token: string): Promise<TokenRecord | null> {
  const tokenId = verifyTokenSignature(token);
  if (!tokenId) return null;

  const store = await readStore();
  const record = store.tokens[tokenId];
  if (!record) return null;

  const now = Date.now();
  if (now >= record.expiresAt) {
    delete store.tokens[tokenId];
    await writeStore(store);
    return null;
  }

  if (record.downloadsUsed >= record.maxDownloads) {
    return null;
  }

  record.downloadsUsed += 1;
  store.tokens[tokenId] = record;

  // Optional: if you want to burn the token after final allowed download
  if (record.downloadsUsed >= record.maxDownloads) {
    // keep record or delete it — I prefer delete for cleanliness
    delete store.tokens[tokenId];
  }

  await writeStore(store);
  return record;
}
