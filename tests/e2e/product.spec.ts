import { test, expect } from "@playwright/test";
test("клиент → заявка → оператор → аналитика → CSV", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/demo");
  await page
    .getByRole("button", { name: "Сколько стоит?", exact: true })
    .click();
  await expect(
    page.getByText("Тарифы и стоимость", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Сообщение", exact: true })
    .fill("Хочу заказать бота срочно");
  await page
    .getByRole("button", { name: "Отправить сообщение", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Оставить заявку", exact: false })
    .click();
  await page.getByLabel("Имя", { exact: true }).fill("Тестовый клиент");
  await page.getByLabel("Контакт", { exact: true }).fill("browser@example.com");
  await page.getByLabel("Компания", { exact: true }).fill("Тестовый бизнес");
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Отправить заявку", exact: true })
    .click();
  await expect(
    page.getByText("Заявка передана менеджеру", { exact: true }),
  ).toBeVisible();
  const admin = await context.newPage();
  await admin.goto("/dashboard");
  await admin
    .getByRole("button", { name: "Войти в демо", exact: true })
    .click();
  await expect(
    admin.getByRole("heading", { name: "Всё начинается с диалога" }),
  ).toBeVisible();
  await admin.goto("/dashboard/leads?q=Тестовый");
  await admin.getByText("Тестовый клиент", { exact: true }).first().click();
  await expect(
    admin.getByRole("heading", { name: "Тестовый клиент", exact: true }),
  ).toBeVisible();
  await admin.getByLabel("Стадия", { exact: true }).selectOption("qualified");
  await admin
    .getByLabel("Заметки менеджера", { exact: true })
    .fill("Встреча согласована");
  await admin.getByRole("button", { name: "Сохранить изменения" }).click();
  await expect(
    admin.getByText("Изменения сохранены", { exact: true }),
  ).toBeVisible();
  await admin.reload();
  await expect(admin.getByLabel("Стадия", { exact: true })).toHaveValue(
    "qualified",
  );
  if (
    await admin
      .getByRole("button", { name: "Принять диалог", exact: true })
      .isVisible()
  )
    await admin
      .getByRole("button", { name: "Принять диалог", exact: true })
      .click();
  await admin
    .getByRole("textbox", { name: "Сообщение оператора", exact: true })
    .fill("Здравствуйте! Давайте согласуем время встречи.");
  await admin.getByRole("button", { name: "Отправить", exact: true }).click();
  await expect(
    admin.getByText("Здравствуйте! Давайте согласуем время встречи.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Здравствуйте! Давайте согласуем время встречи.", {
      exact: true,
    }),
  ).toBeVisible({ timeout: 15000 });
  await admin.goto("/dashboard/analytics");
  await expect(
    admin.getByRole("heading", { name: "От диалога к результату" }),
  ).toBeVisible();
  const csv = await context.request.get("/api/admin/export");
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain("browser@example.com");
  expect(errors).toEqual([]);
});
test("API: авторизация, валидация, изоляция диалогов и аналитика", async ({
  request,
}) => {
  expect(
    (
      await request.patch("/api/admin/settings", {
        data: { name: "X", greeting: "Y" },
      })
    ).status(),
  ).toBe(401);
  const before = await request.post("/api/chat", { data: {} });
  expect(before.status()).toBe(200);
  const chat = await before.json();
  expect(
    (
      await request.post("/api/chat", {
        data: { token: "unknown", text: "Тест" },
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await request.post("/api/chat", {
        data: { token: chat.token, text: "a".repeat(2001) },
      })
    ).status(),
  ).toBe(422);
  expect(
    (
      await request.post("/api/chat", {
        data: {
          token: chat.token,
          contact: {
            name: "Тест",
            contact: "test@example.com",
            consent: false,
          },
        },
      })
    ).status(),
  ).toBe(422);
  expect((await request.post("/api/auth", { data: {} })).status()).toBe(200);
  expect(
    (
      await request.post("/api/admin/knowledge", {
        data: { title: "Тест", body: "Коротко", keywords: "тест" },
      })
    ).status(),
  ).toBe(422);
});
test("база знаний: создать, изменить, удалить", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Войти в демо" }).click();
  await expect(
    page.getByRole("heading", { name: "Всё начинается с диалога" }),
  ).toBeVisible();
  await page.goto("/dashboard/knowledge");
  await page.getByRole("button", { name: "Добавить материал" }).click();
  await page.getByLabel("Название", { exact: true }).fill("Тестовый документ");
  await page
    .getByLabel("Текст источника", { exact: true })
    .fill("Тестовый материал для проверки полного цикла редактирования.");
  await page.getByLabel("Ключевые слова", { exact: true }).fill("проверка");
  await page.getByRole("button", { name: "Сохранить материал" }).click();
  await expect(
    page.getByRole("heading", { name: "Тестовый документ", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Изменить Тестовый документ", exact: true })
    .click();
  await page
    .getByLabel("Название", { exact: true })
    .fill("Проверенный документ");
  await page.getByRole("button", { name: "Сохранить материал" }).click();
  await expect(
    page.getByRole("heading", { name: "Проверенный документ", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Удалить Проверенный документ", exact: true })
    .click();
  await page.getByRole("button", { name: "Удалить", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Проверенный документ", exact: true }),
  ).toHaveCount(0);
});
test("мобильные страницы без горизонтального переполнения", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/demo", "/dashboard"]) {
    await page.goto(path);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "Войти в демо" }).click();
  await expect(
    page.getByRole("heading", { name: "Всё начинается с диалога" }),
  ).toBeVisible();
  for (const path of [
    "/dashboard",
    "/dashboard/leads",
    "/dashboard/knowledge",
    "/dashboard/integrations",
  ]) {
    await page.goto(path);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
