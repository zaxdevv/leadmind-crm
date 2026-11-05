import { test, expect } from "@playwright/test";
test("аналитика пересчитывается после новой заявки", async ({
  page,
  request,
}) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Войти в демо" }).click();
  await page
    .getByRole("heading", { name: "Всё начинается с диалога" })
    .waitFor();
  const before = await page.locator(".stat-card > strong").allTextContents();
  const response = await request.post("/api/chat", {
    data: { text: "Хочу заказать бота, какая стоимость?" },
  });
  const chat = await response.json();
  expect(
    (
      await request.post("/api/chat", {
        data: {
          token: chat.token,
          contact: {
            name: "Проверка аналитики",
            contact: "metrics@example.com",
            company: "",
            consent: true,
          },
        },
      })
    ).status(),
  ).toBe(200);
  await page.reload();
  const after = await page.locator(".stat-card > strong").allTextContents();
  expect(Number(after[0])).toBe(Number(before[0]) + 1);
  expect(Number(after[1])).toBe(Number(before[1]) + 1);
  expect(Number(after[3])).toBe(Number(before[3]) + 1);
});
