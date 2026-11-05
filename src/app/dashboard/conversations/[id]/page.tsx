import { authenticated } from "@/lib/security";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeading } from "@/components/dashboard-ui";
import { OperatorChat } from "@/components/operator-chat";
export default async function Conversation({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await authenticated())) return null;

  const { id } = await params;
  const conversation = await db.conversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) notFound();
  return (
    <>
      <PageHeading
        title="Диалог с посетителем"
        description={`${conversation.channel} · ${conversation.topic}`}
      />
      <OperatorChat conversation={conversation} />
    </>
  );
}
