import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { afterAll, afterEach, beforeAll, expect, it, vi } from "vitest";
vi.hoisted(() => {
  process.env.DATABASE_URL = `file:./regression-${process.pid}.db`;
  process.env.OPENAI_API_KEY = "";
  process.env.CRM_WEBHOOK_URL = "";
  process.env.CRM_WEBHOOK_SECRET = "";
});
import { db } from "../../src/lib/db";
import { addClientMessage } from "../../src/services/conversations";
import { saveContact } from "../../src/services/leads";
import { POST } from "../../src/app/api/chat/route";

function seed() {
  execFileSync(process.execPath, ["prisma/seed.ts"], {
    env: process.env,
    stdio: "pipe",
  });
}
beforeAll(() => {
  execFileSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    {
      env: {
        ...process.env,
        PRISMA_SCHEMA_ENGINE_BINARY:
          process.platform === "win32"
            ? resolve("node_modules/@prisma/engines/schema-engine-windows.exe")
            : process.env.PRISMA_SCHEMA_ENGINE_BINARY,
      },
      stdio: "pipe",
    },
  );
  seed();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
afterAll(() => db.$disconnect());

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

it.each(["client", "manager", "manager-return-to-bot"])(
  "handoff %s отбрасывает незавершённый ответ и не блокирует БД",
  async (actor) => {
    const conversation = await db.conversation.create({ data: {} });
    const entered = deferred<void>();
    const reply = deferred<Response>();
    vi.stubEnv("OPENAI_API_KEY", "fake-local-only");
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        entered.resolve();
        return reply.promise;
      }),
    );
    const pending = addClientMessage(conversation.id, "Сколько стоит?");
    await entered.promise;
    if (actor === "client")
      await addClientMessage(conversation.id, "Позовите оператора");
    else {
      await db.conversation.update({
        where: { id: conversation.id },
        data: { mode: "operator", revision: { increment: 1 } },
      });
      if (actor === "manager-return-to-bot")
        await db.conversation.update({
          where: { id: conversation.id },
          data: { mode: "bot", revision: { increment: 1 } },
        });
    }
    reply.resolve(
      Response.json({
        choices: [{ message: { content: "Непроверенный ответ" } }],
      }),
    );
    await pending;
    const result = await db.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
      include: { messages: true },
    });
    expect(result.mode).toBe(
      actor === "manager-return-to-bot" ? "bot" : "operator",
    );
    const answers = result.messages.filter((m) => m.role === "assistant");
    expect(answers).toHaveLength(actor === "client" ? 1 : 0);
    if (answers[0])
      expect(answers[0].text).toContain("Передаю диалог оператору");
  },
);

it("8 параллельных HTTP-запросов возвращают один лид, одно подтверждение и одну постановку доставки", async () => {
  const conversation = await db.conversation.create({ data: {} });
  const contact = {
    name: "Тест параллельности",
    contact: "parallel@example.com",
    company: "Demo",
    consent: true,
  };
  const responses = await Promise.all(
    Array.from({ length: 8 }, () =>
      POST(
        new Request("http://localhost/api/chat", {
          method: "POST",
          body: JSON.stringify({ token: conversation.token, contact }),
        }),
      ),
    ),
  );
  expect(responses.map((r) => r.status)).toEqual(Array(8).fill(200));
  const results = await Promise.all(responses.map((r) => r.json()));
  expect(new Set(results.map((r) => r.lead.id)).size).toBe(1);
  expect(
    await db.lead.count({ where: { conversationId: conversation.id } }),
  ).toBe(1);
  expect(
    await db.message.count({
      where: { conversationId: conversation.id, role: "assistant" },
    }),
  ).toBe(1);
  expect(
    await db.delivery.count({
      where: { lead: { conversationId: conversation.id } },
    }),
  ).toBe(1);
});

it("webhook вызывается один раз после commit, повторы успешны пока он ожидает сеть", async () => {
  const conversation = await db.conversation.create({ data: {} });
  vi.stubEnv("CRM_WEBHOOK_URL", "https://example.invalid/local-mock");
  vi.stubEnv("CRM_WEBHOOK_SECRET", "test-secret");
  const entered = deferred<void>();
  const response = deferred<Response>();
  const fetch = vi.fn(() => {
    entered.resolve();
    return response.promise;
  });
  vi.stubGlobal("fetch", fetch);
  const contact = {
    name: "Тест",
    contact: "delivery@example.com",
    company: "",
    consent: true as const,
  };
  const pending = saveContact(conversation.id, contact);
  await entered.promise;
  await Promise.all(
    Array.from({ length: 8 }, () => saveContact(conversation.id, contact)),
  );
  expect(
    await db.lead.count({ where: { conversationId: conversation.id } }),
  ).toBe(1);
  expect(fetch).toHaveBeenCalledTimes(1);
  response.resolve(new Response("{}"));
  await pending;
  expect(
    await db.delivery.count({
      where: { lead: { conversationId: conversation.id } },
    }),
  ).toBe(2);
});

it("сбой подтверждения откатывает лид и постановку доставки", async () => {
  const conversation = await db.conversation.create({ data: {} });
  await db.$executeRawUnsafe(
    `CREATE TRIGGER reject_confirmation BEFORE INSERT ON Message WHEN NEW.text LIKE 'Спасибо!%' BEGIN SELECT RAISE(ABORT, 'regression failure'); END`,
  );
  try {
    await expect(
      saveContact(conversation.id, {
        name: "Тест",
        contact: "rollback@example.com",
        company: "",
        consent: true,
      }),
    ).rejects.toThrow();
    expect(
      await db.lead.count({ where: { conversationId: conversation.id } }),
    ).toBe(0);
    expect(
      await db.message.count({ where: { conversationId: conversation.id } }),
    ).toBe(0);
    expect(
      await db.delivery.count({
        where: { lead: { conversationId: conversation.id } },
      }),
    ).toBe(0);
  } finally {
    await db.$executeRawUnsafe("DROP TRIGGER reject_confirmation");
  }
});

it("смена XFF не обходит HTTP-лимит записей чата", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.now() + 120000);
  const statuses: number[] = [];
  for (let i = 0; i < 62; i++) {
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "X-Forwarded-For": `192.0.2.${i}` },
        body: JSON.stringify({ token: "nonexistent-token", text: "Тест" }),
      }),
    );
    statuses.push(response.status);
  }
  expect(statuses).toEqual([...Array(60).fill(404), 429, 429]);
});

it("повторный seed сохраняет удаление, правки, прежнюю установку и пустую пользовательскую базу", async () => {
  await db.document.delete({ where: { id: "pricing" } });
  await db.document.update({
    where: { id: "launch" },
    data: { body: "Изменённый материал" },
  });
  seed();
  expect(await db.document.findUnique({ where: { id: "pricing" } })).toBeNull();
  expect(
    (await db.document.findUniqueOrThrow({ where: { id: "launch" } })).body,
  ).toBe("Изменённый материал");
  await db.initialization.deleteMany();
  seed();
  expect(await db.document.findUnique({ where: { id: "pricing" } })).toBeNull();
  await db.conversation.deleteMany();
  await db.document.deleteMany();
  await db.settings.deleteMany();
  seed();
  expect(await db.document.count()).toBe(0);
  expect(await db.conversation.count()).toBe(0);
});
