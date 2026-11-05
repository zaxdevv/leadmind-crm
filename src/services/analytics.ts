import { db } from "@/lib/db";
export async function analytics() {
  const [conversations, leads, hot, response, topics] = await Promise.all([
    db.conversation.findMany({ select: { createdAt: true } }),
    db.lead.count(),
    db.lead.count({ where: { priority: "hot" } }),
    db.message.aggregate({ _avg: { responseMs: true } }),
    db.conversation.groupBy({
      by: ["topic"],
      _count: { _all: true },
      orderBy: { _count: { topic: "desc" } },
    }),
  ]);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - 6 + i);
    return {
      label: date.toLocaleDateString("ru", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }),
      count: conversations.filter(
        (c) => c.createdAt >= date && c.createdAt < new Date(+date + 86400_000),
      ).length,
    };
  });
  return {
    conversations: conversations.length,
    leads,
    hot,
    conversion: conversations.length
      ? Math.round((leads / conversations.length) * 100)
      : 0,
    responseSeconds: Math.round((response._avg.responseMs || 0) / 100) / 10,
    days,
    topics: topics.map((t) => ({ name: t.topic, count: t._count._all })),
  };
}
