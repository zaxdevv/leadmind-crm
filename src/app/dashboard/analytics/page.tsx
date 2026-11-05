import { authenticated } from "@/lib/security";
import { analytics } from "@/services/analytics";
import {
  ActivityChart,
  PageHeading,
  StatsGrid,
  Topics,
} from "@/components/dashboard-ui";
export default async function Analytics() {
  if (!(await authenticated())) return null;

  const data = await analytics();
  return (
    <>
      <PageHeading
        title="От диалога к результату"
        description="Понимайте спрос и находите точки роста отдела продаж."
      />
      <StatsGrid data={data} />
      <div className="charts-grid">
        <ActivityChart data={data} />
        <Topics data={data} />
      </div>
      <section className="panel explanation">
        <h2>Как считаются показатели</h2>
        <p>
          Диалог — уникальная сессия клиента. Заявка — диалог с сохранённым
          контактом и согласием. Конверсия — доля диалогов, ставших заявками.
          Горячие лиды определяются по намерению заказать, запустить или
          заключить договор.
        </p>
        <p>
          Общие показатели учитывают всю базу. График показывает семь
          календарных дней по UTC. Время ответа — среднее сохранённое время
          подготовки ответа бота; ответы операторов не включаются.
        </p>
      </section>
    </>
  );
}
