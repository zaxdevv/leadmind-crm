import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { isIP } from "node:net";
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
export function demoLoginEnabled() {
  return (
    process.env.DEMO_LOGIN_ENABLED === "true" ||
    (process.env.NODE_ENV !== "production" &&
      process.env.DEMO_LOGIN_ENABLED !== "false")
  );
}
function sessionContext() {
  const purpose = demoLoginEnabled() ? "demo" : "admin";
  const version = createHmac("sha256", secret())
    .update(
      JSON.stringify([
        purpose,
        process.env.ADMIN_PASSWORD || "",
        process.env.AUTH_SESSION_VERSION || "1",
      ]),
    )
    .digest("hex");
  return { purpose, version };
}
export function sessionToken() {
  const { purpose, version } = sessionContext();
  const payload = `v1.${purpose}.${version}.${Date.now() + 8 * 3600_000}`;
  return `${payload}.${createHmac("sha256", secret()).update(payload).digest("hex")}`;
}
export function validSession(value: string | undefined) {
  if (!value) return false;
  const [format, purpose, version, exp, sig, extra] = value.split(".");
  const current = sessionContext();
  const payload = [format, purpose, version, exp].join(".");
  return (
    format === "v1" &&
    !extra &&
    purpose === current.purpose &&
    version === current.version &&
    (purpose !== "admin" || !!process.env.ADMIN_PASSWORD) &&
    /^\d+$/.test(exp || "") &&
    Number(exp) > Date.now() &&
    Number(exp) <= Date.now() + 8 * 3600_000 &&
    !!sig &&
    equals(sig, createHmac("sha256", secret()).update(payload).digest("hex"))
  );
}
export async function authenticated() {
  return validSession((await cookies()).get("leadmind_session")?.value);
}
export function rateLimitClient(request: Request) {
  const proxySecret = process.env.TRUSTED_PROXY_SECRET;
  if (
    proxySecret &&
    proxySecret.length >= 32 &&
    equals(request.headers.get("x-leadmind-proxy-secret") || "", proxySecret)
  ) {
    const ip = request.headers.get("x-leadmind-client-ip")?.trim();
    if (ip && isIP(ip)) return ip.toLowerCase();
  }
  return "direct";
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
