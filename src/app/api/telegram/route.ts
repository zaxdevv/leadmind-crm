import { z } from "zod";
import { db } from "@/lib/db";
import { equals } from "@/lib/security";
import { errorResponse, HttpError, jsonBody } from "@/lib/http";
import { addClientMessage } from "@/services/conversations";
import { sendTelegram } from "@/services/integrations";
export async function POST(request: Request) {
  try {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!secret || !process.env.TELEGRAM_BOT_TOKEN)
      throw new HttpError(503, "Telegram не настроен");
    if (
      !equals(
        request.headers.get("x-telegram-bot-api-secret-token") || "",
        secret,
      )
    )
      throw new HttpError(403, "Неверный секрет");
    const update = z
      .object({
        update_id: z.number().int(),
        message: z
          .object({
            chat: z.object({ id: z.number(), type: z.string() }),
            text: z.string().max(2000).optional(),
          })
          .optional(),
      })
      .parse(await jsonBody(request));
    if (!update.message || update.message.chat.type !== "private")
      return Response.json({ ok: true });
    if (await db.telegramUpdate.findUnique({ where: { id: update.update_id } }))
      return Response.json({ ok: true });
    const telegramId = String(update.message.chat.id);
    let conversation = await db.conversation.findUnique({
      where: { telegramId },
    });
    if (!conversation)
      conversation = await db.conversation.create({
        data: { telegramId, channel: "Telegram" },
      });
    const text = update.message.text || "";
    if (text === "/start")
      await sendTelegram(
        telegramId,
        "Здравствуйте! Спросите о стоимости, сроках или интеграциях. Чтобы оставить заявку с согласием на обработку контакта, откройте " +
          (process.env.APP_URL || "http://localhost:3000") +
          "/demo",
      );
    else if (text) {
      const reply = await addClientMessage(conversation.id, text);
      if (reply) await sendTelegram(telegramId, reply.text);
    }
    await db.telegramUpdate.create({ data: { id: update.update_id } });
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
