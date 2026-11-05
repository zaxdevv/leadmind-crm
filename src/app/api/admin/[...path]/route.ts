import { z } from "zod";
import { db } from "@/lib/db";
import { authenticated, rateLimit } from "@/lib/security";
import { checkOrigin, errorResponse, HttpError, jsonBody } from "@/lib/http";
import { csvCell, priorities, stages } from "@/lib/domain";
import { sendTelegram, sheetsRow } from "@/services/integrations";
const documentSchema = z.object({
  title: z.string().trim().min(3).max(100),
  body: z.string().trim().min(20).max(10000),
  keywords: z.string().trim().min(3).max(500),
});
type Context = { params: Promise<{ path: string[] }> };
async function handle(request: Request, context: Context) {
  try {
    if (!(await authenticated())) throw new HttpError(401, "Войдите в CRM");
    checkOrigin(request);
    if (!rateLimit("admin", 180)) throw new HttpError(429, "Подождите минуту");
    const { path } = await context.params;
    const [resource, id] = path;
    if (resource === "export" && request.method === "GET") {
      const leads = await db.lead.findMany({ orderBy: { createdAt: "desc" } });
      const isSheets = new URL(request.url).searchParams.has("sheets");
      const rows = leads.map((l) =>
        isSheets
          ? sheetsRow(l)
          : [
              l.name,
              l.contact,
              l.company,
              stages[l.status as keyof typeof stages],
              priorities[l.priority as keyof typeof priorities],
              l.createdAt.toISOString(),
            ],
      );
      const header = isSheets
        ? ["Дата", "Имя", "Контакт", "Компания", "Приоритет", "Статус"]
        : ["Имя", "Контакт", "Компания", "Статус", "Приоритет", "Дата"];
      return new Response(
        "\uFEFF" +
          [header, ...rows]
            .map((row) => row.map(csvCell).join(";"))
            .join("\r\n"),
        {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="leadmind-leads.csv"',
            "Cache-Control": "no-store",
          },
        },
      );
    }
    if (resource === "knowledge") {
      if (request.method === "POST")
        return Response.json(
          await db.document.create({
            data: documentSchema.parse(await jsonBody(request)),
          }),
        );
      if (request.method === "PATCH" && id)
        return Response.json(
          await db.document.update({
            where: { id },
            data: documentSchema.parse(await jsonBody(request)),
          }),
        );
      if (request.method === "DELETE" && id) {
        await db.document.delete({ where: { id } });
        return Response.json({ ok: true });
      }
    }
    if (resource === "leads" && id && request.method === "PATCH") {
      const data = z
        .object({
          status: z
            .enum(["new", "working", "qualified", "won", "closed"])
            .optional(),
          priority: z.enum(["cold", "warm", "hot"]).optional(),
          tags: z.string().max(300).optional(),
          notes: z.string().max(5000).optional(),
        })
        .parse(await jsonBody(request));
      return Response.json(await db.lead.update({ where: { id }, data }));
    }
    if (resource === "conversations" && id) {
      const conversation = await db.conversation.findUnique({ where: { id } });
      if (!conversation) throw new HttpError(404, "Диалог не найден");
      if (request.method === "PATCH") {
        const { mode } = z
          .object({ mode: z.enum(["bot", "operator"]) })
          .parse(await jsonBody(request));
        return Response.json(
          await db.conversation.update({
            where: { id },
            data: { mode, revision: { increment: 1 } },
          }),
        );
      }
      if (request.method === "POST") {
        const { text } = z
          .object({ text: z.string().trim().min(1).max(2000) })
          .parse(await jsonBody(request));
        if (conversation.mode !== "operator")
          throw new HttpError(409, "Сначала примите диалог");
        if (conversation.telegramId)
          await sendTelegram(conversation.telegramId, text);
        return Response.json(
          await db.message.create({
            data: { conversationId: id, role: "operator", text },
          }),
        );
      }
    }
    if (resource === "settings" && request.method === "PATCH") {
      const data = z
        .object({
          name: z.string().trim().min(2).max(80),
          greeting: z.string().trim().min(10).max(600),
        })
        .parse(await jsonBody(request));
      return Response.json(
        await db.settings.upsert({
          where: { id: "bot" },
          create: data,
          update: data,
        }),
      );
    }
    throw new HttpError(404, "Маршрут не найден");
  } catch (error) {
    return errorResponse(error);
  }
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
