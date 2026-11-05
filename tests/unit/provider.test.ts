import { afterEach, describe, expect, it, vi } from "vitest";
import { groundedAnswer } from "../../src/services/knowledge";
const document = {
  id: "launch",
  title: "Сроки",
  body: "Запуск занимает 7 рабочих дней. Поддержка доступна по будням.",
  keywords: "срок",
  updatedAt: new Date(),
};
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("Ответы внешнего провайдера", () => {
  it("работает без ключа и сетевого вызова", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(await groundedAnswer(document)).toBe(document.body);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("возвращает источник при ошибке провайдера", async () => {
    vi.stubEnv("OPENAI_API_KEY", "unit-test");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await groundedAnswer(document)).toBe(document.body);
  });
  it("отклоняет выдуманные условия", async () => {
    vi.stubEnv("OPENAI_API_KEY", "unit-test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          choices: [
            {
              message: {
                content: "Запустим за один день совершенно бесплатно.",
              },
            },
          ],
        }),
      ),
    );
    expect(await groundedAnswer(document)).toBe(document.body);
  });
  it("принимает проверяемое предложение источника", async () => {
    vi.stubEnv("OPENAI_API_KEY", "unit-test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          choices: [
            { message: { content: "Запуск занимает 7 рабочих дней." } },
          ],
        }),
      ),
    );
    expect(await groundedAnswer(document)).toBe(
      "Запуск занимает 7 рабочих дней.",
    );
  });
});
