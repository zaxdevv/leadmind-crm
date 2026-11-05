import { authenticated } from "@/lib/security";
import { Download, Search } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeading, LeadTable } from "@/components/dashboard-ui";
import { priorities, stages } from "@/lib/domain";
export default async function Leads({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; priority?: string }>;
}) {
  if (!(await authenticated())) return null;

  const filters = await searchParams;
  const leads = await db.lead.findMany({
    where: {
      ...(filters.q
        ? {
            OR: [
              { name: { contains: filters.q.slice(0, 100) } },
              { contact: { contains: filters.q.slice(0, 100) } },
              { company: { contains: filters.q.slice(0, 100) } },
            ],
          }
        : {}),
      ...(filters.status && filters.status in stages
        ? { status: filters.status }
        : {}),
      ...(filters.priority && filters.priority in priorities
        ? { priority: filters.priority }
        : {}),
    },
    include: { conversation: { select: { channel: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <>
      <PageHeading
        title="Лиды"
        description="От первого интереса до новой сделки."
      >
        <a download className="button secondary" href="/api/admin/export">
          <Download size={16} />
          Скачать CSV
        </a>
      </PageHeading>
      <section className="panel">
        <form className="filter-bar">
          <label className="search-box">
            <Search size={17} />
            <input
              aria-label="Поиск лидов"
              name="q"
              placeholder="Имя, компания или контакт"
              defaultValue={filters.q}
            />
          </label>
          <select
            name="status"
            aria-label="Стадия"
            defaultValue={filters.status || ""}
          >
            <option value="">Все стадии</option>
            {Object.entries(stages).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select
            name="priority"
            aria-label="Приоритет"
            defaultValue={filters.priority || ""}
          >
            <option value="">Любой приоритет</option>
            {Object.entries(priorities).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <button className="secondary">Найти</button>
        </form>
        <div className="list-meta">Найдено заявок: {leads.length}</div>
        <LeadTable leads={leads} />
      </section>
    </>
  );
}
