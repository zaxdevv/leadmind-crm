import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkOrigin, errorResponse, HttpError, jsonBody } from "@/lib/http";
import { rateLimit, rateLimitClient } from "@/lib/security";
import { addClientMessage } from "@/services/conversations";
import { saveContact } from "@/services/leads";
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
    const body = z
      .object({
        token: z.string().max(100).optional(),
        text: z.string().trim().min(1).max(2000).optional(),
        contact: contactSchema.optional(),
      })
      .parse(await jsonBody(request));
    const reading = !!body.token && !body.text && !body.contact;
    if (
      !rateLimit(
        `chat:${reading ? "read" : "write"}:${rateLimitClient(request)}`,
        reading ? 600 : 60,
      )
    )
      throw new HttpError(429, "Слишком много сообщений. Подождите минуту.");
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
    if (body.contact) await saveContact(conversation.id, body.contact);
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
