import { test, expect, type Page } from "@playwright/test";

function barrier() {
  let release!: () => void;
  const promise = new Promise<void>((done) => {
    release = done;
  });
  return { promise, release };
}
async function storedToken(page: Page) {
  return page.evaluate(() => localStorage.getItem("leadmind-chat"));
}

for (const operation of ["submit", "restore", "poll"] as const) {
  test(`сброс во время ${operation} не возвращает историю или токен`, async ({
    page,
    request,
  }) => {
    const old = await (
      await request.post("/api/chat", { data: { text: "Сколько стоит?" } })
    ).json();
    await page.addInitScript(
      (token) => localStorage.setItem("leadmind-chat", token),
      old.token,
    );
    const entered = barrier();
    const release = barrier();
    const finished = barrier();
    if (operation === "poll") await page.clock.install();
    let armed = operation === "restore";
    await page.route("**/api/chat", async (route) => {
      const body = route.request().postDataJSON();
      const response = await route.fetch();
      const held = armed && (operation !== "submit" || body.text);
      if (held) {
        armed = false;
        entered.release();
        await release.promise;
      }
      try {
        await route.fulfill({ response });
      } catch {
      } finally {
        if (held) finished.release();
      }
    });
    await page.goto("/demo");
    if (operation !== "restore") {
      await expect(
        page.getByText("Тарифы и стоимость", { exact: true }),
      ).toBeVisible();
      armed = true;
      if (operation === "submit") {
        await page
          .getByRole("textbox", { name: "Сообщение", exact: true })
          .fill("Какие сроки?");
        await page.getByRole("button", { name: "Отправить сообщение" }).click();
      } else await page.clock.fastForward(5000);
    }
    await entered.promise;
    await page.getByRole("button", { name: "Новый диалог" }).click();
    release.release();
    await finished.promise;
    await expect(
      page.getByText("Тарифы и стоимость", { exact: true }),
    ).toHaveCount(0);
    expect(await storedToken(page)).toBeNull();
    await expect(
      page.getByRole("textbox", { name: "Сообщение", exact: true }),
    ).toHaveValue("");
  });
}

for (const failure of ["offline", 429, 500] as const) {
  test(`восстановление после ${failure} сохраняет ключ, блокирует отправку и повторяется`, async ({
    page,
    request,
  }) => {
    const old = await (
      await request.post("/api/chat", { data: { text: "Сколько стоит?" } })
    ).json();
    await page.addInitScript(
      (token) => localStorage.setItem("leadmind-chat", token),
      old.token,
    );
    let fail = true;
    let writes = 0;
    await page.route("**/api/chat", async (route) => {
      if (route.request().postDataJSON().text) writes++;
      if (!fail) return route.continue();
      if (failure === "offline") await route.abort("internetdisconnected");
      else
        await route.fulfill({
          status: failure,
          json: { error: "temporary failure" },
        });
    });
    await page.goto("/demo");
    await expect(
      page.getByRole("button", { name: "Повторить восстановление" }),
    ).toBeVisible();
    expect(await storedToken(page)).toBe(old.token);
    await page
      .getByRole("textbox", { name: "Сообщение", exact: true })
      .fill("Новый вопрос");
    await expect(
      page.getByRole("button", { name: "Отправить сообщение" }),
    ).toBeDisabled();
    expect(writes).toBe(0);
    fail = false;
    await page
      .getByRole("button", { name: "Повторить восстановление" })
      .click();
    await expect(
      page.getByText("Тарифы и стоимость", { exact: true }),
    ).toBeVisible();
    expect(await storedToken(page)).toBe(old.token);
    await expect(
      page.getByRole("button", { name: "Отправить сообщение" }),
    ).toBeEnabled();
  });
}

test("только подтверждённый 404 удаляет ключ", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("leadmind-chat", "missing-token"),
  );
  await page.goto("/demo");
  await expect(
    page.getByRole("button", { name: "Сколько стоит?", exact: true }),
  ).toBeEnabled();
  expect(await storedToken(page)).toBeNull();
});

test("завершение отправки сохраняет следующий черновик", async ({ page }) => {
  const entered = barrier();
  const release = barrier();
  await page.route("**/api/chat", async (route) => {
    const response = await route.fetch();
    entered.release();
    await release.promise;
    await route.fulfill({ response });
  });
  await page.goto("/demo");
  const input = page.getByRole("textbox", { name: "Сообщение", exact: true });
  await input.fill("Сколько стоит?");
  await page.getByRole("button", { name: "Отправить сообщение" }).click();
  await entered.promise;
  await input.fill("Черновик следующего вопроса");
  release.release();
  await expect(
    page.getByText("Тарифы и стоимость", { exact: true }),
  ).toBeVisible();
  await expect(input).toHaveValue("Черновик следующего вопроса");
});

for (const width of [1440, 390]) {
  test(`контраст и читаемость подписей при ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/demo");
    await page
      .getByRole("button", { name: "Сколько стоит?", exact: true })
      .click();
    await expect(page.locator(".source")).toBeVisible();
    const results = await page.evaluate(() => {
      function luminance(rgb: number[]) {
        const c = rgb
          .map((v) => v / 255)
          .map((v) =>
            v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
          );
        return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
      }
      return [".message > small", ".source", ".chat-footnote"].map(
        (selector) => {
          const element = document.querySelector(selector)!;
          const style = getComputedStyle(element);
          const foreground = luminance(style.color.match(/\d+/g)!.map(Number));
          let background = "rgba(0, 0, 0, 0)";
          for (
            let parent: Element | null = element;
            parent;
            parent = parent.parentElement
          ) {
            background = getComputedStyle(parent).backgroundColor;
            if (background !== "rgba(0, 0, 0, 0)") break;
          }
          const back = luminance(background.match(/\d+/g)!.map(Number));
          return {
            selector,
            contrast:
              (Math.max(foreground, back) + 0.05) /
              (Math.min(foreground, back) + 0.05),
            size: parseFloat(style.fontSize),
          };
        },
      );
    });
    for (const result of results) {
      expect(result.contrast, result.selector).toBeGreaterThanOrEqual(4.5);
      expect(result.size, result.selector).toBeGreaterThanOrEqual(12);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
