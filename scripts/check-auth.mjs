import assert from "node:assert/strict";
import { spawn } from "node:child_process";
const demo = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const port = process.env.TEST_CLOSED_PORT || "3002";
const closed = `http://127.0.0.1:${port}`;
const password = "regression-only-password";
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    port,
  ],
  {
    env: {
      ...process.env,
      DEMO_LOGIN_ENABLED: "false",
      ADMIN_PASSWORD: password,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  },
);
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Closed server startup timed out")),
      30000,
    );
    server.stdout.on("data", (data) => {
      if (data.toString().includes("Ready")) {
        clearTimeout(timeout);
        resolve();
      }
    });
    server.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Closed server exited: ${code}`));
    });
    server.once("error", reject);
  });
  async function login(base, body) {
    return fetch(base + "/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
  const demoLogin = await login(demo, {});
  assert.equal(demoLogin.status, 200);
  const cookie = demoLogin.headers.get("set-cookie").split(";")[0];
  assert.equal(
    (await fetch(demo + "/api/admin/export", { headers: { cookie } })).status,
    200,
  );
  assert.equal((await login(closed, {})).status, 401);
  assert.equal((await login(closed, { password: "wrong" })).status, 401);
  const admin = await login(closed, { password });
  assert.equal(admin.status, 200);
  assert.equal(
    (await fetch(closed + "/api/admin/export", { headers: { cookie } })).status,
    401,
  );
  assert.equal(
    (
      await fetch(closed + "/api/admin/export", {
        headers: { cookie: admin.headers.get("set-cookie").split(";")[0] },
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await fetch(demo + "/api/admin/export", {
        headers: { cookie: admin.headers.get("set-cookie").split(";")[0] },
      })
    ).status,
    401,
  );
  const statuses = [];
  for (let i = 0; i < 10; i++)
    statuses.push(
      (
        await fetch(closed + "/api/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Forwarded-For": `192.0.2.${i}`,
          },
          body: JSON.stringify({ password: "wrong" }),
        })
      ).status,
    );
  assert.deepEqual(
    statuses,
    [401, 401, 401, 401, 401, 401, 401, 429, 429, 429],
  );
  console.log(
    "PASS: production demo/closed sessions, admin access, XFF forgery",
  );
} finally {
  server.kill();
}
