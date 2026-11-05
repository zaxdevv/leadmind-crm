import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
const localSecret = randomBytes(32).toString("hex");
function secret() {
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32)
  )
    throw new Error("AUTH_SECRET must contain at least 32 characters");
  return process.env.AUTH_SECRET || localSecret;
}
export function equals(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function sessionToken() {
  const exp = String(Date.now() + 8 * 3600_000);
  return `${exp}.${createHmac("sha256", secret()).update(exp).digest("hex")}`;
}
export async function authenticated() {
  const value = (await cookies()).get("leadmind_session")?.value;
  if (!value) return false;
  const [exp, sig] = value.split(".");
  return (
    Number(exp) > Date.now() &&
    !!sig &&
    equals(sig, createHmac("sha256", secret()).update(exp).digest("hex"))
  );
}
const buckets = new Map<string, { count: number; until: number }>();
export function rateLimit(key: string, limit = 60) {
  const now = Date.now();
  if (buckets.size > 10000)
    for (const [k, v] of buckets) if (v.until < now) buckets.delete(k);
  const old = buckets.get(key);
  const bucket =
    old && old.until > now ? old : { count: 0, until: now + 60_000 };
  bucket.count++;
  buckets.set(key, bucket);
  return bucket.count <= limit;
}
