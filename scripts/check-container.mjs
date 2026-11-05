import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
const base = process.env.CONTAINER_BASE_URL || "http://127.0.0.1:3001";
const statePath =
  process.env.CONTAINER_TEST_STATE || "/tmp/leadmind-container-check.json";
const stage = process.argv[2];
const login = await fetch(base + "/api/auth", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: "{}",
});
assert.equal(login.status, 200);
const cookie = login.headers.get("set-cookie").split(";")[0];
if (stage === "write") {
  assert.equal((await fetch(base + "/api/sources/pricing")).status, 200);
  assert.equal(
    (
      await fetch(base + "/api/admin/knowledge/pricing", {
        method: "DELETE",
        headers: { cookie },
      })
    ).status,
    200,
  );
  const chat = await (
    await fetch(base + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Проверка сохранения после перезапуска" }),
    })
  ).json();
  assert.ok(chat.token);
  await writeFile(
    statePath,
    JSON.stringify({ token: chat.token, count: chat.messages.length }),
  );
} else if (stage === "read") {
  const state = JSON.parse(await readFile(statePath, "utf8"));
  assert.equal((await fetch(base + "/api/sources/pricing")).status, 404);
  const chat = await (
    await fetch(base + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: state.token }),
    })
  ).json();
  assert.equal(chat.messages.length, state.count);
  assert.ok(
    chat.messages.some(
      (message) => message.text === "Проверка сохранения после перезапуска",
    ),
  );
} else throw new Error("Expected write or read");
console.log(`PASS: container persistence ${stage}`);
