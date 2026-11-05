import { db } from "@/lib/db";
import { wantsOperator } from "@/lib/domain";
import { findDocument, groundedAnswer } from "./knowledge";
export async function addClientMessage(conversationId: string, text: string) {
  const started = Date.now();
  const conversation = await db.conversation.findUniqueOrThrow({
    where: { id: conversationId },
  });
  await db.message.create({ data: { conversationId, role: "user", text } });
  if (conversation.mode === "operator") return;
  const doc = findDocument(text, await db.document.findMany());
  const handoff = wantsOperator(text) || !doc;
  const reply = handoff
    ? "Передаю диалог оператору. Он увидит всю переписку. Можете оставить контакт, чтобы мы связались с вами."
    : await groundedAnswer(doc!);
  await db.$transaction([
    db.conversation.update({
      where: { id: conversationId },
      data: {
        mode: handoff ? "operator" : "bot",
        topic: doc?.title || conversation.topic,
      },
    }),
    db.message.create({
      data: {
        conversationId,
        role: "assistant",
        text: reply,
        sourceId: doc?.id,
        sourceTitle: doc?.title,
        responseMs: Date.now() - started,
      },
    }),
  ]);
}
