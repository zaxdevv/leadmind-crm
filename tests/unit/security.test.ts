import { afterEach, expect, it, vi } from "vitest";
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ set: vi.fn() }),
}));
import {
  rateLimit,
  rateLimitClient,
  sessionToken,
  validSession,
} from "../../src/lib/security";
import { POST } from "../../src/app/api/auth/route";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
it("отзывает demo-cookie при закрытии установки с прежним секретом", () => {
  vi.stubEnv("AUTH_SECRET", "security-regression-secret-32-characters");
  vi.stubEnv("DEMO_LOGIN_ENABLED", "true");
  const demo = sessionToken();
  expect(validSession(demo)).toBe(true);
  vi.stubEnv("DEMO_LOGIN_ENABLED", "false");
  vi.stubEnv("ADMIN_PASSWORD", "new-password");
  expect(validSession(demo)).toBe(false);
  const admin = sessionToken();
  expect(validSession(admin)).toBe(true);
  vi.stubEnv("ADMIN_PASSWORD", "rotated-password");
  expect(validSession(admin)).toBe(false);
});
it("проверяет версию, подпись, срок и точный формат сессии", () => {
  vi.stubEnv("DEMO_LOGIN_ENABLED", "true");
  const token = sessionToken();
  expect(validSession(token + ".extra")).toBe(false);
  expect(validSession(token.replace("demo", "admin"))).toBe(false);
  expect(validSession("9999999999999.signature")).toBe(false);
  vi.stubEnv("AUTH_SESSION_VERSION", "rotated");
  expect(validSession(token)).toBe(false);
  const rotated = sessionToken();
  vi.useFakeTimers();
  vi.advanceTimersByTime(8 * 3600_000 + 1);
  expect(validSession(rotated)).toBe(false);
});
it("смена клиентского XFF не меняет корзину прямого запуска", () => {
  for (let i = 0; i < 12; i++) {
    const client = rateLimitClient(
      new Request("http://localhost", {
        headers: { "x-forwarded-for": `192.0.2.${i}` },
      }),
    );
    expect(client).toBe("direct");
    expect(rateLimit(`xff-test:${client}`, 10)).toBe(i < 10);
  }
});
it("доверяет нормализованному IP только с секретом proxy", () => {
  vi.stubEnv(
    "TRUSTED_PROXY_SECRET",
    "proxy-test-secret-at-least-32-characters",
  );
  const headers = {
    "x-leadmind-client-ip": "192.0.2.1",
    "x-leadmind-proxy-secret": process.env.TRUSTED_PROXY_SECRET!,
  };
  expect(rateLimitClient(new Request("http://localhost", { headers }))).toBe(
    "192.0.2.1",
  );
  expect(
    rateLimitClient(
      new Request("http://localhost", {
        headers: { ...headers, "x-leadmind-proxy-secret": "forged" },
      }),
    ),
  ).toBe("direct");
  expect(
    rateLimitClient(
      new Request("http://localhost", {
        headers: { ...headers, "x-leadmind-client-ip": "192.0.2.1, 1.1.1.1" },
      }),
    ),
  ).toBe("direct");
});
it("общий лимит входа срабатывает даже при разных доверенных IP", async () => {
  vi.stubEnv("DEMO_LOGIN_ENABLED", "false");
  vi.stubEnv("ADMIN_PASSWORD", "correct");
  vi.stubEnv(
    "TRUSTED_PROXY_SECRET",
    "proxy-test-secret-at-least-32-characters",
  );
  const statuses: number[] = [];
  for (let i = 0; i < 32; i++) {
    const response = await POST(
      new Request("http://localhost/api/auth", {
        method: "POST",
        headers: {
          "x-leadmind-proxy-secret": process.env.TRUSTED_PROXY_SECRET!,
          "x-leadmind-client-ip": `192.0.2.${i}`,
        },
        body: JSON.stringify({ password: "wrong" }),
      }),
    );
    statuses.push(response.status);
  }
  expect(statuses).toEqual([...Array(30).fill(401), 429, 429]);
});
