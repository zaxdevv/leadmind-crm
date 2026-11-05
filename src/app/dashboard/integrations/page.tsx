import { authenticated } from "@/lib/security";
import {
  Send,
  Webhook,
  Table2,
  BrainCircuit,
  ArrowUpRight,
  Check,
} from "lucide-react";
import { db } from "@/lib/db";
import { PageHeading } from "@/components/dashboard-ui";
export default async function Integrations() {
  if (!(await authenticated())) return null;

  const deliveries = await db.delivery.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    select: { id: true, adapter: true, status: true, createdAt: true },
  });
  const integrations = [
    {
      name: "Telegram",
      icon: Send,
      enabled: !!process.env.TELEGRAM_BOT_TOKEN,
      description:
        "Входящие сообщения и ответы оператора в привычном мессенджере.",
      env: "TELEGRAM_BOT_TOKEN + TELEGRAM_WEBHOOK_SECRET",
      note: "Webhook: POST /api/telegram",
    },
    {
      name: "Внешняя CRM",
      icon: Webhook,
      enabled: !!process.env.CRM_WEBHOOK_URL,
      description: "Передавайте новые заявки в свою CRM с HMAC-подписью.",
      env: "CRM_WEBHOOK_URL + CRM_WEBHOOK_SECRET",
      note: "Событие lead.created · Idempotency-Key",
    },
    {
      name: "OpenAI-compatible API",
      icon: BrainCircuit,
      enabled: !!process.env.OPENAI_API_KEY,
      description:
        "Внешний ИИ выбирает предложения из найденного источника. При сбое работает локальный движок.",
      env: "OPENAI_API_KEY + OPENAI_BASE_URL + OPENAI_MODEL",
      note: "Без ключа: локальные ответы по базе знаний",
    },
  ];
  return (
    <>
      <PageHeading
        title="Ваша система. Без разрывов."
        description="Подключайте каналы и передавайте заявки туда, где работает команда."
      />
      <div className="integrations-grid">
        {integrations.map((i) => (
          <section className="panel integration-card" key={i.name}>
            <div className="row spread">
              <span className="document-icon">
                <i.icon size={24} />
              </span>
              <span className={`badge ${i.enabled ? "cold" : "neutral"}`}>
                {i.enabled ? "Настроено" : "Не подключено"}
              </span>
            </div>
            <h2>{i.name}</h2>
            <p>{i.description}</p>
            <code>{i.env}</code>
            <small>{i.note}</small>
          </section>
        ))}
        <section className="panel integration-card">
          <div className="row spread">
            <span className="document-icon">
              <Table2 size={24} />
            </span>
            <span className="badge warm">Демо-адаптер</span>
          </div>
          <h2>Google Sheets</h2>
          <p>
            Готовые строки для таблицы: дата, имя, контакт, компания, приоритет
            и стадия. Прямую запись можно подключить через интерфейс LeadSink.
          </p>
          <a download className="text-link" href="/api/admin/export?sheets=1">
            Скачать строки CSV <ArrowUpRight size={16} />
          </a>
          <small>Без авторизации Google · подготовка данных локально</small>
        </section>
      </div>
      <section className="panel explanation">
        <h2>
          <Check size={20} /> Подключение без утечки ключей
        </h2>
        <p>
          Укажите переменные в .env и перезапустите сервер. Секреты не
          отображаются в панели. Пошаговая настройка и формат webhook описаны в
          README репозитория.
        </p>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Журнал интеграций</h2>
            <p>Последние попытки передачи заявок</p>
          </div>
        </div>
        {deliveries.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Адаптер</th>
                  <th>Результат</th>
                  <th>Время</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id}>
                    <td>{d.adapter}</td>
                    <td>
                      {{
                        sent: "Отправлено",
                        failed: "Ошибка доставки",
                        prepared: "Строка подготовлена",
                      }[d.status] || d.status}
                    </td>
                    <td>{d.createdAt.toLocaleString("ru")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">Журнал появится после первой новой заявки.</p>
        )}
      </section>
    </>
  );
}
