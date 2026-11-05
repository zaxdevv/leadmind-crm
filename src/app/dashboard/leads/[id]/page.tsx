import { authenticated } from "@/lib/security";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeading } from "@/components/dashboard-ui";
import { LeadEditor } from "@/components/lead-editor";
import { OperatorChat } from "@/components/operator-chat";
export default async function LeadDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await authenticated())) return null;

  const { id } = await params;
  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      conversation: {
        include: { messages: { orderBy: { createdAt: "asc" } } },
      },
    },
  });
  if (!lead) notFound();
  const { createdAt, consentAt, conversation, ...editable } = lead;
  return (
    <>
      <Link className="text-link back-link" href="/dashboard/leads">
        <ArrowLeft size={15} />
        Все лиды
      </Link>
      <PageHeading
        title={lead.name}
        description={`${conversation.channel} · ${createdAt.toLocaleDateString("ru")} · согласие получено ${consentAt.toLocaleDateString("ru")}`}
      />
      <div className="detail-grid">
        <LeadEditor lead={editable} />
        <OperatorChat conversation={conversation} />
      </div>
    </>
  );
}
