import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  MessageSquare,
  BookOpen,
  UserRound,
  Check,
  Layers3,
  MousePointer2,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "@/components/brand";
export default function Landing() {
  return (
    <div className="landing">
      <header className="marketing-nav">
        <Brand />
        <nav aria-label="Главное меню">
          <a href="#features">Возможности</a>
          <a href="#workflow">Как работает</a>
          <Link href="/dashboard">
            Войти в CRM <ArrowUpRight size={15} />
          </Link>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="status-dot" /> ИИ-ПОМОЩНИК ДЛЯ ВАШЕГО БИЗНЕСА
            </span>
            <h1>
              Хороший разговор.
              <br />
              <span className="blue">Начало новой сделки.</span>
            </h1>
            <p>
              LeadMind отвечает клиентам, узнаёт их задачи и собирает заявки.
              Ваша команда подключается в нужный момент — с полным контекстом.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/demo">
                Попробовать помощника <ArrowRight size={18} />
              </Link>
              <Link className="button secondary" href="/dashboard">
                Посмотреть CRM <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className="hero-proof">
              <span>
                <Check size={15} />
                Без API-ключей
              </span>
              <span>
                <Check size={15} />
                Локальный запуск
              </span>
              <span>
                <Check size={15} />
                Открытый код
              </span>
            </div>
          </div>
          <div className="hero-product">
            <div className="preview-top">
              <Brand />
              <span className="subtle-badge">Демонстрация сценария</span>
            </div>
            <div className="preview-body">
              <div className="preview-chat">
                <span className="eyebrow">ДИАЛОГ С КЛИЕНТОМ</span>
                <div className="preview-message user">
                  Хочу автоматизировать заявки. С чего начать?
                </div>
                <div className="preview-message bot">
                  Начнём с задач вашей команды. Запуск занимает 7–14 рабочих
                  дней. Помочь выбрать решение?
                  <small>
                    <BookOpen size={12} />
                    Сроки и процесс запуска
                  </small>
                </div>
                <div className="preview-message user">
                  Да, давайте обсудим проект.
                </div>
                <div className="preview-contact">
                  <Check size={17} />
                  <div>
                    Контакт получен<small>С согласия клиента</small>
                  </div>
                </div>
              </div>
              <div className="preview-lead">
                <span className="eyebrow">НОВАЯ ВОЗМОЖНОСТЬ</span>
                <div className="preview-avatar">
                  <UserRound size={28} />
                </div>
                <h3>Заявка на внедрение</h3>
                <span className="badge hot">Горячий лид</span>
                <dl>
                  <div>
                    <dt>Источник</dt>
                    <dd>Чат на сайте</dd>
                  </div>
                  <div>
                    <dt>Интерес</dt>
                    <dd>Автоматизация</dd>
                  </div>
                  <div>
                    <dt>Следующий шаг</dt>
                    <dd>Встреча с командой</dd>
                  </div>
                </dl>
                <Link href="/demo">
                  Пройти этот путь <ArrowRight size={15} />
                </Link>
              </div>
            </div>
            <div className="preview-bottom">
              <span className="status-dot" />
              Ответ из базы знаний{" "}
              <span>
                Контекст сохранён <Check size={13} />
              </span>
            </div>
            <div className="product-caption">
              <MousePointer2 size={16} />
              От вопроса до заявки — в одном диалоге
            </div>
          </div>
        </section>
        <section className="channel-strip">
          <span>Одна команда. Все обращения.</span>
          <b>Чат на сайте</b>
          <b>Telegram</b>
          <b>Ваша CRM</b>
          <b>
            Google Sheets <small>адаптер</small>
          </b>
        </section>
        <section className="feature-section" id="features">
          <div className="section-heading">
            <span className="eyebrow">МЕНЬШЕ РУТИНЫ. БОЛЬШЕ КОНТЕКСТА.</span>
            <h2>
              Пока вы занимаетесь бизнесом,
              <br />
              LeadMind начинает разговор.
            </h2>
            <p>Три вещи, которые помогают не терять интерес клиента.</p>
          </div>
          <div className="feature-grid">
            {[
              [
                BookOpen,
                "Знает ваше предложение",
                "Отвечает по базе знаний, указывает источник и не придумывает условия.",
              ],
              [
                Layers3,
                "Превращает интерес в заявку",
                "Собирает контакт с согласия клиента и определяет приоритет обращения.",
              ],
              [
                UserRound,
                "Вовремя зовёт человека",
                "Передаёт сложный вопрос оператору вместе с историей переписки.",
              ],
            ].map(([Icon, title, text], index) => {
              const I = Icon as typeof MessageSquare;
              return (
                <article className="feature-card" key={String(title)}>
                  <div className="row spread">
                    <I size={26} />
                    <span>0{index + 1}</span>
                  </div>
                  <h3>{String(title)}</h3>
                  <p>{String(text)}</p>
                </article>
              );
            })}
          </div>
        </section>
        <section className="workflow-section" id="workflow">
          <div>
            <span className="eyebrow">ПОЛНЫЙ ЦИКЛ РАБОТЫ</span>
            <h2>
              Ни одного
              <br />
              потерянного контекста.
            </h2>
            <p>
              Посмотрите на продукт с двух сторон: сначала станьте клиентом,
              затем продолжите диалог из CRM.
            </p>
            <Link href="/demo" className="text-link">
              Пройти демо за несколько минут <ArrowRight size={17} />
            </Link>
          </div>
          <ol>
            {[
              ["Клиент задаёт вопрос", "Помощник находит подходящий материал."],
              [
                "Интерес становится заявкой",
                "Контакты и приоритет появляются в CRM.",
              ],
              [
                "Менеджер делает следующий шаг",
                "Ведёт разговор, меняет стадию, фиксирует договорённости.",
              ],
            ].map(([a, b], i) => (
              <li key={a}>
                <span>0{i + 1}</span>
                <div>
                  <h3>{a}</h3>
                  <p>{b}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className="landing-cta">
          <ShieldCheck size={28} />
          <div>
            <h2>Сначала попробуйте. Затем адаптируйте.</h2>
            <p>
              Рабочая основа для чат-бота вашего бизнеса. Без обязательной
              подписки на ИИ.
            </p>
          </div>
          <Link href="/demo" className="button">
            Открыть демо <ArrowUpRight size={17} />
          </Link>
        </section>
      </main>
      <footer className="marketing-footer">
        <Brand />
        <p>Проект zaxdev · Компания и примеры в демо вымышлены</p>
        <a href="https://github.com/zaxdevv/leadmind-crm">
          Код на GitHub <ArrowUpRight size={15} />
        </a>
      </footer>
    </div>
  );
}
