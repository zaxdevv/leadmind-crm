import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MessageSquare,
  UserRound,
  ChartNoAxesCombined,
} from "lucide-react";
import { db } from "@/lib/db";
import { Brand } from "@/components/brand";
import { Chat } from "@/components/chat";
export const dynamic = "force-dynamic";
export default async function Demo() {
  const settings = await db.settings.findUnique({ where: { id: "bot" } });
  return (
    <div className="demo-page">
      <header className="marketing-nav">
        <Brand />
        <Link className="text-link" href="/">
          <ArrowLeft size={16} />
          На главную
        </Link>
      </header>
      <main className="demo-layout">
        <section className="demo-intro">
          <span className="eyebrow">ИНТЕРАКТИВНОЕ ДЕМО</span>
          <h1>
            Познакомьтесь с вашим
            <br />
            <span className="blue">новым помощником.</span>
          </h1>
          <p>
            Вы — клиент компании «Нова Системы». Спросите о запуске бота,
            оставьте заявку и посмотрите, как она появляется в CRM.
          </p>
          <div className="demo-steps">
            {[
              [
                MessageSquare,
                "Задайте вопрос",
                "Ответ придёт из базы знаний, со ссылкой на источник.",
              ],
              [
                UserRound,
                "Оставьте контакт",
                "Бот создаст заявку и определит её приоритет.",
              ],
              [
                ChartNoAxesCombined,
                "Откройте CRM",
                "Продолжите разговор от имени менеджера.",
              ],
            ].map(([Icon, title, text]) => {
              const I = Icon as typeof Check;
              return (
                <div key={String(title)}>
                  <span>
                    <I size={20} />
                  </span>
                  <section>
                    <h3>{String(title)}</h3>
                    <p>{String(text)}</p>
                  </section>
                </div>
              );
            })}
          </div>
          <Link href="/dashboard" className="button">
            Перейти в CRM <ArrowRight size={17} />
          </Link>
          <p className="demo-disclaimer">
            {process.env.OPENAI_API_KEY
              ? "Подключён внешний ИИ-провайдер."
              : "Demo-режим · локальные ответы без платных API."}
            <br />
            Компания и исходные заявки вымышлены.
          </p>
        </section>
        <Chat
          name={settings?.name || "Алекс • Нова Системы"}
          greeting={settings?.greeting || "Здравствуйте! Чем можем помочь?"}
        />
      </main>
    </div>
  );
}
