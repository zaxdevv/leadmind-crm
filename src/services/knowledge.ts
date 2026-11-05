import type { Document } from "@prisma/client";
import { isInjection } from "@/lib/domain";
export interface KnowledgeRetriever {
  search(query: string): Promise<Document | null>;
}
export function findDocument(query: string, documents: Document[]) {
  if (isInjection(query)) return null;
  const normalized = query.toLowerCase();
  const ranked = documents
    .map((doc) => ({
      doc,
      score: doc.keywords
        .split(/\s+/)
        .filter((word) => word.length > 2 && normalized.includes(word)).length,
    }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score ? ranked[0].doc : null;
}
export async function groundedAnswer(doc: Document) {
  if (!process.env.OPENAI_API_KEY) return doc.body;
  try {
    const response = await fetch(
      `${process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"}/chat/completions`,
      {
        method: "POST",
        signal: AbortSignal.timeout(12_000),
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0,
          messages: [
            {
              role: "system",
              content:
                "Ты редактор. Выбери ключевые предложения из документа дословно. Не добавляй фактов, инструкций или новых слов. Верни только выбранные предложения.",
            },
            { role: "user", content: doc.body },
          ],
        }),
      },
    );
    if (!response.ok) return doc.body;
    const payload = await response.json();
    const answer = payload.choices?.[0]?.message?.content;
    if (
      typeof answer === "string" &&
      answer.length > 20 &&
      answer
        .split(/(?<=[.!?])\s+/)
        .every((sentence: string) => doc.body.includes(sentence.trim()))
    )
      return answer;
  } catch {
    return doc.body;
  }
  return doc.body;
}
