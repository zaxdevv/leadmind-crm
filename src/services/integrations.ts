import { createHmac } from "node:crypto";
import type { Lead } from "@prisma/client";
import { db } from "@/lib/db";
export interface LeadSink {
  deliver(lead: Lead): Promise<void>;
}
export function sheetsRow(lead: Lead) {
  return [
    lead.createdAt.toISOString(),
    lead.name,
    lead.contact,
    lead.company,
    lead.priority,
    lead.status,
  ];
}
export async function deliverLead(lead: Lead) {
  await db.delivery.create({
    data: { leadId: lead.id, adapter: "sheets-demo", status: "prepared" },
  });
  if (!process.env.CRM_WEBHOOK_URL || !process.env.CRM_WEBHOOK_SECRET) return;
  const body = JSON.stringify({
    event: "lead.created",
    id: lead.id,
    createdAt: lead.createdAt,
    name: lead.name,
    contact: lead.contact,
    priority: lead.priority,
    company: lead.company,
  });
  let status = "failed";
  try {
    const result = await fetch(process.env.CRM_WEBHOOK_URL, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
      headers: {
        "Content-Type": "application/json",
        "X-LeadMind-Signature": createHmac(
          "sha256",
          process.env.CRM_WEBHOOK_SECRET,
        )
          .update(body)
          .digest("hex"),
        "Idempotency-Key": lead.id,
      },
      body,
    });
    status = result.ok ? "sent" : "failed";
  } catch {}
  await db.delivery.create({
    data: { leadId: lead.id, adapter: "crm-webhook", status },
  });
}
export async function sendTelegram(chatId: string, text: string) {
  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      signal: AbortSignal.timeout(8000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    },
  );
  if (!response.ok) throw new Error("Telegram delivery failed");
}
