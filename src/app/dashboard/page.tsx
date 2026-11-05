import { authenticated } from "@/lib/security";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Download, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { analytics } from "@/services/analytics";
import {
  ActivityChart,
  LeadTable,
  PageHeading,
  StatsGrid,
  Topics,
} from "@/components/dashboard-ui";
export default async function Dashboard() {
  if (!(await authenticated())) return null;

  const [data, leads] = await Promise.all([
    analytics(),
    db.lead.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { conversation: { select: { channel: true } } },
    }),
  ]);
  return (
    <>
      <PageHeading
        title="Всё начинается с диалога"
        description="Заявки, разговоры и работа команды — в одном месте."
      >
        <a download className="button secondary" href="/api/admin/export">
          <Download size={16} />
          Экспорт лидов
        </a>
      </PageHeading>
      <div className="insight-banner">
        <span className="insight-icon">
          <Sparkles size={23} />
        </span>
        <div>
          <strong>Ваш помощник уже на связи</strong>
          <p>
            Он консультирует по базе знаний и передаёт сложные вопросы команде.
          </p>
        </div>
        <Link href="/demo">
          Начать диалог <ArrowUpRight size={17} />
        </Link>
      </div>
      <StatsGrid data={data} />
      <div className="charts-grid">
        <ActivityChart data={data} />
        <Topics data={data} />
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Последние заявки</h2>
            <p>У каждого обращения есть следующий шаг</p>
          </div>
          <Link href="/dashboard/leads" className="text-link">
            Все лиды <ArrowRight size={16} />
          </Link>
        </div>
        <LeadTable leads={leads} />
      </section>
      <p className="data-note">
        Показатели рассчитаны по базе данных. Исходные записи —
        демонстрационные.
      </p>
    </>
  );
}
