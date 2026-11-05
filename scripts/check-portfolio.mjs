import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.PORTFOLIO_BASE_URL || "http://127.0.0.1:43221/";
const output =
  process.env.PORTFOLIO_CHECK_OUTPUT || "output/playwright/portfolio";
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`);
    });
    assert.equal((await page.goto(base + "#leadmind")).status(), 200);
    await page.locator("#leadmind").scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);
    const links = await page
      .locator("a")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
    assert.ok(links.includes("https://github.com/zaxdevv/leadmind-crm"));
    assert.ok(links.every((href) => href && !href.includes("hmsusbusas-png")));
    const local = await page.evaluate(() => [
      ...Array.from(
        document.querySelectorAll("img"),
        (image) => image.currentSrc || image.src,
      ),
      ...Array.from(
        document.querySelectorAll('link[rel="stylesheet"], link[rel="icon"]'),
        (link) => link.href,
      ),
    ]);
    for (const url of new Set(local))
      assert.equal((await page.request.get(url)).status(), 200, url);
    const brokenAnchors = await page
      .locator('a[href^="#"]')
      .evaluateAll((nodes) =>
        nodes
          .filter(
            (node) =>
              !document.getElementById(node.getAttribute("href").slice(1)),
          )
          .map((node) => node.getAttribute("href")),
      );
    assert.deepEqual(brokenAnchors, []);
    assert.ok(
      await page
        .locator("#leadmind img")
        .evaluate((image) => image.complete && image.naturalWidth > 0),
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.deepEqual(errors, []);
    await page.locator("#leadmind").screenshot({
      path: `${output}/${width}-case.png`,
      animations: "disabled",
    });
    await page.screenshot({
      path: `${output}/${width}-page.png`,
      fullPage: true,
      animations: "disabled",
    });
    results.push({
      width,
      errors,
      resources: new Set(local).size,
      links: links.length,
      overflow: false,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
await writeFile(
  `${output}/results.json`,
  JSON.stringify({ base, results }, null, 2),
);
console.log(JSON.stringify({ base, results }));
