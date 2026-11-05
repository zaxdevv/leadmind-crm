import Link from "next/link";
import {
  ArrowUpRight,
  MessagesSquare,
  Users,
  Target,
  Flame,
  Timer,
  ArrowRight,
} from "lucide-react";
import { priorities, stages } from "@/lib/domain";
import type { analytics } from "@/services/analytics";
type Stats = Awaited<ReturnType<typeof analytics>>;
export function PageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">НОВА СИСТЕМЫ · ДЕМО-ПРОСТРАНСТВО</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
export function StatsGrid({ data }: { data: Stats }) {
  const stats = [
    ["Диалоги", data.conversations, MessagesSquare, "Все обращения"],
    ["Новые возможности", data.leads, Users, "Заявки с контактами"],
    ["Конверсия", `${data.conversion}%`, Target, "Из диалога в заявку"],
    ["Горячие лиды", data.hot, Flame, "Готовы к следующему шагу"],
  ] as const;
  return (
    <div className="stats-grid">
      {stats.map(([label, value, Icon, hint], i) => (
        <div
          className={`stat-card ${i === 3 ? "accent-stat" : ""}`}
          key={label}
        >
          <div className="stat-label">
            {label}
            <Icon size={18} />
          </div>
          <strong>{value}</strong>
          <small>{hint}</small>
        </div>
      ))}
    </div>
  );
}
export function ActivityChart({ data }: { data: Stats }) {
  const max = Math.max(1, ...data.days.map((d) => d.count));
  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <h2>Поток обращений</h2>
          <p>Диалоги за последние семь дней · UTC</p>
        </div>
        <span className="subtle-badge">7 дней</span>
      </div>
      <div
        className="chart"
        role="img"
        aria-label={data.days.map((d) => `${d.label}: ${d.count}`).join(", ")}
      >
        {data.days.map((day, i) => (
          <div className="chart-column" key={day.label}>
            <span className="bar-value">{day.count}</span>
            <div
              className={`chart-bar ${i === 6 ? "current" : ""}`}
              style={{ height: `${Math.max(2, (day.count / max) * 145)}px` }}
            />
            <span className="chart-label">{day.label}</span>
          </div>
        ))}
      </div>
      <div className="chart-footer">
        <span className="legend-dot" />
        Диалоги с клиентами <span className="muted">Все каналы</span>
      </div>
    </section>
  );
}
export function Topics({ data }: { data: Stats }) {
  const max = Math.max(1, ...data.topics.map((t) => t.count));
  return (
    <section className="panel topics-panel">
      <div className="panel-heading">
        <div>
          <h2>Что интересует клиентов</h2>
          <p>Темы из истории обращений</p>
        </div>
        <ArrowUpRight size={19} />
      </div>
      {data.topics.slice(0, 5).map((t) => (
        <div className="topic" key={t.name}>
          <div>
            <span>{t.name}</span>
            <b>{t.count}</b>
          </div>
          <div className="topic-track">
            <span style={{ width: `${(t.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
      {!data.topics.length && <p>Темы появятся после первого обращения.</p>}
      <div className="response-time">
        <Timer size={17} />
        <span>Среднее время ответа</span>
        <strong>{data.responseSeconds} с</strong>
      </div>
    </section>
  );
}
export type LeadRow = {
  id: string;
  name: string;
  company: string;
  contact: string;
  priority: string;
  status: string;
  createdAt: Date | string;
  conversation: { channel: string };
};
export function LeadTable({ leads }: { leads: LeadRow[] }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Клиент</th>
            <th>Приоритет</th>
            <th>Стадия</th>
            <th>Источник</th>
            <th>Создан</th>
            <th>
              <span className="sr-only">Открыть</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id}>
              <td>
                <Link className="lead-name" href={`/dashboard/leads/${l.id}`}>
                  <span className="avatar">
                    {l.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <span>
                    <b>{l.name}</b>
                    <small>{l.company || l.contact}</small>
                  </span>
                </Link>
              </td>
              <td>
                <span className={`badge ${l.priority}`}>
                  {priorities[l.priority as keyof typeof priorities]}
                </span>
              </td>
              <td>
                <span className={`stage stage-${l.status}`}>
                  {stages[l.status as keyof typeof stages]}
                </span>
              </td>
              <td>
                <span className="channel">{l.conversation.channel}</span>
              </td>
              <td className="muted">
                {new Date(l.createdAt).toLocaleDateString("ru", {
                  day: "numeric",
                  month: "short",
                })}
              </td>
              <td>
                <Link
                  href={`/dashboard/leads/${l.id}`}
                  aria-label={`Открыть ${l.name}`}
                >
                  <ArrowUpRight size={17} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!leads.length && (
        <div className="empty">
          <h3>Заявок пока нет</h3>
          <p>Измените фильтры или создайте заявку в чате.</p>
          <Link href="/demo">
            Открыть демо <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );
}
