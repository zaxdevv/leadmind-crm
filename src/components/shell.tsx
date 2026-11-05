"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  MessagesSquare,
  BookOpen,
  ChartNoAxesCombined,
  Plug,
  Settings,
  ArrowUpRight,
  LogOut,
  FlaskConical,
} from "lucide-react";
import { Brand } from "./brand";
import { api } from "@/lib/client";
const navigation = [
  ["/dashboard", "Обзор", LayoutDashboard],
  ["/dashboard/leads", "Лиды", Users],
  ["/dashboard/conversations", "Диалоги", MessagesSquare],
  ["/dashboard/knowledge", "База знаний", BookOpen],
  ["/dashboard/analytics", "Аналитика", ChartNoAxesCombined],
  ["/dashboard/integrations", "Интеграции", Plug],
  ["/dashboard/settings", "Настройки", Settings],
] as const;
export function Shell({
  children,
  demo,
}: {
  children: React.ReactNode;
  demo: boolean;
}) {
  const path = usePathname();
  const router = useRouter();
  return (
    <div className="workspace">
      <aside className="sidebar">
        <Brand />
        <div className="workspace-label">
          <span className="workspace-avatar">Н</span>
          <div>
            Нова Системы<small>Рабочее пространство</small>
          </div>
          <span className="demo-pill">DEMO</span>
        </div>
        <p className="nav-caption">УПРАВЛЕНИЕ ПРОДАЖАМИ</p>
        <nav aria-label="CRM">
          {navigation.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              className={
                (href === "/dashboard" ? path === href : path.startsWith(href))
                  ? "nav-link active"
                  : "nav-link"
              }
            >
              <Icon size={19} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-card">
            <FlaskConical size={19} />
            <strong>Попробуйте со стороны клиента</strong>
            <p>Начните диалог и проследите путь до заявки.</p>
            <Link href="/demo">
              Открыть чат <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="profile">
            <span className="avatar">МК</span>
            <div>
              Менеджер<small>Демо-пространство</small>
            </div>
            <button
              className="icon-button"
              aria-label="Выйти"
              onClick={async () => {
                await api("/api/auth", "DELETE");
                router.refresh();
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="app-header">
          <span>
            Рабочее пространство <span className="separator">/</span>{" "}
            <b>
              {navigation.find(([href]) =>
                href === "/dashboard" ? path === href : path.startsWith(href),
              )?.[1] || "Лид"}
            </b>
          </span>
          <div className="header-right">
            <span className="status-dot" />
            {demo ? "Локальный demo-движок" : "ИИ-провайдер подключён"}
            <Link href="/demo" className="text-link">
              Тестировать бота <ArrowUpRight size={15} />
            </Link>
          </div>
        </header>
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
