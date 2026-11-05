import { db } from "@/lib/db";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return new Response("Источник удалён", { status: 404 });
  return new Response(`${doc.title}\n\n${doc.body}`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
