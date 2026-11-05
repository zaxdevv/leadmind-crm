import { createHmac } from "node:crypto";
import { afterEach, expect, it, vi } from "vitest";
import type { Lead } from "@prisma/client";
const { record } = vi.hoisted(() => ({ record: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { delivery: { create: record } } }));
import { deliverLead } from "../../src/services/integrations";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  record.mockReset();
});
const lead: Lead = {
  id: "lead-unit",
  conversationId: "conversation",
  name: "Пример",
  contact: "example@example.com",
  company: "",
  status: "new",
  priority: "warm",
  tags: "",
  notes: "",
  consentAt: new Date(),
  createdAt: new Date(),
};
it("подписывает точное тело и передаёт ключ дедупликации", async () => {
  vi.stubEnv("CRM_WEBHOOK_URL", "https://crm.example.com/webhook");
  vi.stubEnv("CRM_WEBHOOK_SECRET", "unit-secret");
  const fetch = vi.fn().mockResolvedValue(new Response("{}"));
  vi.stubGlobal("fetch", fetch);
  await deliverLead(lead);
  const options = fetch.mock.calls[0][1];
  expect(options.headers["X-LeadMind-Signature"]).toBe(
    createHmac("sha256", "unit-secret").update(options.body).digest("hex"),
  );
  expect(options.headers["Idempotency-Key"]).toBe(lead.id);
  expect(record).toHaveBeenLastCalledWith({
    data: { leadId: lead.id, adapter: "crm-webhook", status: "sent" },
  });
});
it("сбой CRM отражается в журнале без потери локальной заявки", async () => {
  vi.stubEnv("CRM_WEBHOOK_URL", "https://crm.example.com/webhook");
  vi.stubEnv("CRM_WEBHOOK_SECRET", "unit-secret");
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  await expect(deliverLead(lead)).resolves.toBeUndefined();
  expect(record).toHaveBeenLastCalledWith({
    data: { leadId: lead.id, adapter: "crm-webhook", status: "failed" },
  });
});
