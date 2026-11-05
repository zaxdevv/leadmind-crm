import { db } from "@/lib/db";
import { wantsOperator } from "@/lib/domain";
import { findDocument, groundedAnswer } from "./knowledge";
export async function addClientMessage(conversationId: string, text: string) {
  const started = Date.now();
  const conversation = await db.$transaction(async (tx) => {
    const current = await tx.conversation.update({
      where: { id: conversationId },
      data: { revision: { increment: 1 } },
    });
    await tx.message.create({ data: { conversationId, role: "user", text } });
    return current;
  });
  if (conversation.mode === "operator") return null;
  const doc = findDocument(text, await db.document.findMany());
  const handoff = wantsOperator(text) || !doc;
  const reply = handoff
    ? "Передаю диалог оператору. Он увидит всю переписку. Можете оставить контакт, чтобы мы связались с вами."
    : await groundedAnswer(doc!);
  return db.$transaction(async (tx) => {
    const claimed = await tx.conversation.updateMany({
      where: {
        id: conversationId,
        mode: "bot",
        revision: conversation.revision,
      },
      data: {
        ...(handoff ? { mode: "operator" } : {}),
        revision: { increment: 1 },
        topic: doc?.title || conversation.topic,
      },
    });
    if (!claimed.count) return null;
    return tx.message.create({
      data: {
        conversationId,
        role: "assistant",
        text: reply,
        sourceId: handoff ? null : doc?.id,
        sourceTitle: handoff ? null : doc?.title,
        responseMs: Date.now() - started,
      },
    });
  });
}
