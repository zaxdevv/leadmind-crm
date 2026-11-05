import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const base = process.env.SCREENSHOT_BASE_URL || "http://localhost:3000";
const output = fileURLToPath(new URL("../docs/portfolio/", import.meta.url));
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
async function capture(path, file, fullPage = false) {
  await page.goto(base + path);
  await page.locator("h1").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".chat-messages").evaluateAll((nodes) =>
    nodes.forEach((node) => {
      node.scrollTop = node.scrollHeight;
    }),
  );
  await page.screenshot({
    path: output + "/" + file,
    fullPage,
    animations: "disabled",
  });
}
await page.goto(base + "/dashboard");
await page.getByRole("button", { name: "Войти в демо" }).click();
await page.getByRole("heading", { name: "Всё начинается с диалога" }).waitFor();
await capture("/dashboard", "01-dashboard.png", true);
await capture("/", "02-landing.png", true);
await page.goto(base + "/demo");
await page.getByRole("button", { name: "Сколько стоит?", exact: true }).click();
await page.getByText("Тарифы и стоимость", { exact: true }).waitFor();
await page.locator(".chat-messages").evaluateAll((nodes) =>
  nodes.forEach((node) => {
    node.scrollTop = node.scrollHeight;
  }),
);
await page.screenshot({
  path: output + "/03-chat.png",
  fullPage: true,
  animations: "disabled",
});
await page
  .getByRole("button", { name: "Оставить заявку", exact: false })
  .click();
await page.getByLabel("Имя", { exact: true }).fill("Артём Власов");
await page.getByLabel("Контакт", { exact: true }).fill("artem@example.com");
await page.getByLabel("Компания", { exact: true }).fill("Бюро Ритм");
await page.getByRole("checkbox").check();
await page
  .getByRole("button", { name: "Отправить заявку", exact: true })
  .click();
await page.getByText("Заявка передана менеджеру", { exact: true }).waitFor();
await capture("/dashboard/leads", "04-leads.png", true);
await page.getByText("Артём Власов", { exact: true }).first().click();
await page.getByRole("heading", { name: "Артём Власов" }).waitFor();
await page.getByLabel("Стадия", { exact: true }).selectOption("working");
await page.getByLabel("Теги через запятую").fill("Автоматизация, Новый проект");
await page
  .getByLabel("Заметки менеджера")
  .fill(
    "Нужен помощник для первичной консультации. Подготовить предложение по тарифу Бизнес и согласовать встречу с командой.",
  );
await page.getByRole("button", { name: "Сохранить изменения" }).click();
await page.getByText("Изменения сохранены", { exact: true }).waitFor();
await page.getByRole("button", { name: "Принять диалог", exact: true }).click();
await page
  .getByRole("textbox", { name: "Сообщение оператора" })
  .fill(
    "Артём, здравствуйте! Я Мария, менеджер Нова Системы. Расскажите, какие вопросы чаще всего задают ваши клиенты — предложим подходящий сценарий.",
  );
await page.getByRole("button", { name: "Отправить", exact: true }).click();
await page
  .getByText(
    "Артём, здравствуйте! Я Мария, менеджер Нова Системы. Расскажите, какие вопросы чаще всего задают ваши клиенты — предложим подходящий сценарий.",
    { exact: true },
  )
  .waitFor();
await page.locator(".chat-messages").evaluateAll((nodes) =>
  nodes.forEach((node) => {
    node.scrollTop = node.scrollHeight;
  }),
);
await page.screenshot({
  path: output + "/05-lead-detail.png",
  fullPage: true,
  animations: "disabled",
});
await capture("/dashboard/knowledge", "06-knowledge.png", true);
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(base + "/demo");
await page.getByRole("button", { name: "Новый диалог" }).click();
await page.getByRole("button", { name: "Какие сроки?", exact: true }).click();
await page.getByText("Сроки и процесс запуска", { exact: true }).waitFor();
await page.locator(".chat-messages").evaluateAll((nodes) =>
  nodes.forEach((node) => {
    node.scrollTop = node.scrollHeight;
  }),
);
await page.screenshot({
  path: output + "/07-mobile.png",
  fullPage: true,
  animations: "disabled",
});
console.log(JSON.stringify({ screenshots: 7, browserErrors: errors }));
await browser.close();
if (errors.length) process.exitCode = 1;
