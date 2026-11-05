import { authenticated } from "@/lib/security";
import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeading } from "@/components/dashboard-ui";
export default async function Conversations() {
  if (!(await authenticated())) return null;

  const conversations = await db.conversation.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      lead: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
  });
  return (
    <>
      <PageHeading
        title="Каждый разговор — в контексте"
        description="Клиенту не нужно повторять вопрос. Команда видит всю историю."
      />
      <div className="conversation-grid">
        {conversations.map((c) => (
          <Link
            className="panel conversation-card"
            href={
              c.lead
                ? `/dashboard/leads/${c.lead.id}`
                : `/dashboard/conversations/${c.id}`
            }
            key={c.id}
          >
            <div className="row spread">
              <span className="channel">{c.channel}</span>
              <span
                className={`badge ${c.mode === "operator" ? "warm" : "cold"}`}
              >
                {c.mode === "operator" ? "Ожидает оператора" : "Помощник"}
              </span>
            </div>
            <h2>{c.lead?.name || "Посетитель сайта"}</h2>
            <small>{c.topic}</small>
            <p>{c.messages[0]?.text || "Диалог только начался"}</p>
            <footer>
              {c._count.messages} сообщений{" "}
              <span>{c.createdAt.toLocaleDateString("ru")}</span>
            </footer>
          </Link>
        ))}
      </div>
      {!conversations.length && (
        <div className="panel empty">
          <h2>Диалогов пока нет</h2>
          <Link href="/demo">Начать первый разговор</Link>
        </div>
      )}
    </>
  );
}
