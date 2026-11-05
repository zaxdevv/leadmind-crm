import { authenticated } from "@/lib/security";
import { ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeading } from "@/components/dashboard-ui";
import { KnowledgeEditor } from "@/components/knowledge-editor";
export default async function Knowledge() {
  if (!(await authenticated())) return null;

  const documents = await db.document.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return (
    <>
      <PageHeading
        title="Знания, которым можно доверять"
        description="Помощник отвечает по вашим материалам и всегда показывает источник."
      />
      <div className="info-banner">
        <ShieldCheck size={20} />
        <span>
          Нет подтверждённого ответа — вопрос получает оператор. Изменения
          материалов применяются сразу.
        </span>
      </div>
      <KnowledgeEditor documents={documents} />
    </>
  );
}
