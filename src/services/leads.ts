import { Prisma, type Lead } from "@prisma/client";
import { db } from "@/lib/db";
import { qualify } from "@/lib/domain";
import { deliverLead } from "./integrations";

type Contact = {
  name: string;
  contact: string;
  company: string;
  consent: true;
};
export async function saveContact(conversationId: string, contact: Contact) {
  let created: Lead | null;
  try {
    created = await db.$transaction(
      async (tx) => {
        await tx.conversation.update({
          where: { id: conversationId },
          data: { id: conversationId },
        });
        const existing = await tx.lead.findUnique({
          where: { conversationId },
        });
        if (existing) return null;
        const messages = await tx.message.findMany({
          where: { conversationId, role: "user" },
        });
        const lead = await tx.lead.create({
          data: {
            conversationId,
            name: contact.name,
            contact: contact.contact,
            company: contact.company,
            consentAt: new Date(),
            priority: qualify(messages.map((m) => m.text).join(" ")),
            deliveries: {
              create: [
                { adapter: "sheets-demo", status: "prepared" },
                ...(process.env.CRM_WEBHOOK_URL &&
                process.env.CRM_WEBHOOK_SECRET
                  ? [{ adapter: "crm-webhook", status: "pending" }]
                  : []),
              ],
            },
          },
        });
        await tx.message.create({
          data: {
            conversationId,
            role: "assistant",
            text: "Спасибо! Заявка сохранена. Менеджер свяжется с вами в рабочее время: по будням с 10:00 до 19:00 по Москве.",
          },
        });
        return lead;
      },
      { maxWait: 10000 },
    );
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002" ||
      !(await db.lead.findUnique({ where: { conversationId } }))
    )
      throw error;
    return;
  }
  if (created) await deliverLead(created);
}
