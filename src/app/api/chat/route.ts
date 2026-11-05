import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkOrigin, errorResponse, HttpError, jsonBody } from "@/lib/http";
import { rateLimit } from "@/lib/security";
import { qualify } from "@/lib/domain";
import { addClientMessage } from "@/services/conversations";
import { deliverLead } from "@/services/integrations";
const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  contact: z
    .string()
    .trim()
    .max(120)
    .refine(
      (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ||
        /^@[a-zA-Z0-9_]{5,32}$/.test(v) ||
        /^\+?[\d\s()-]{10,22}$/.test(v),
    ),
  company: z.string().trim().max(120).default(""),
  consent: z.literal(true),
});
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (!rateLimit(`chat:${request.headers.get("x-forwarded-for") || "local"}`))
      throw new HttpError(429, "Слишком много сообщений. Подождите минуту.");
    const body = z
      .object({
        token: z.string().max(100).optional(),
        text: z.string().trim().min(1).max(2000).optional(),
        contact: contactSchema.optional(),
      })
      .parse(await jsonBody(request));
    let conversation = body.token
      ? await db.conversation.findUnique({ where: { token: body.token } })
      : null;
    if (body.token && !conversation)
      throw new HttpError(404, "Диалог не найден");
    if (!conversation) {
      const settings = await db.settings.findUnique({ where: { id: "bot" } });
      conversation = await db.conversation.create({
        data: {
          token: randomBytes(32).toString("base64url"),
          messages: {
            create: {
              role: "assistant",
              text: settings?.greeting || "Здравствуйте! Чем можем помочь?",
            },
          },
        },
      });
    }
    if (body.text) await addClientMessage(conversation.id, body.text);
    if (body.contact) {
      const existing = await db.lead.findUnique({
        where: { conversationId: conversation.id },
      });
      if (!existing) {
        const messages = await db.message.findMany({
          where: { conversationId: conversation.id, role: "user" },
        });
        const lead = await db.lead.create({
          data: {
            conversationId: conversation.id,
            name: body.contact.name,
            contact: body.contact.contact,
            company: body.contact.company,
            consentAt: new Date(),
            priority: qualify(messages.map((m) => m.text).join(" ")),
          },
        });
        await db.message.create({
          data: {
            conversationId: conversation.id,
            role: "assistant",
            text: "Спасибо! Заявка сохранена. Менеджер свяжется с вами в рабочее время: по будням с 10:00 до 19:00 по Москве.",
          },
        });
        await deliverLead(lead);
      }
    }
    return Response.json(
      await db.conversation.findUnique({
        where: { id: conversation.id },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
          lead: { select: { id: true } },
        },
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
