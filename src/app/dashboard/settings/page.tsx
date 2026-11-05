import { authenticated } from "@/lib/security";
import { db } from "@/lib/db";
import { PageHeading } from "@/components/dashboard-ui";
import { SettingsForm } from "@/components/settings-form";
export default async function Settings() {
  if (!(await authenticated())) return null;

  const settings = await db.settings.findUnique({ where: { id: "bot" } });
  return (
    <>
      <PageHeading
        title="Настройки помощника"
        description="Пусть первый ответ звучит как ваша команда."
      />
      <SettingsForm
        name={settings?.name || "Алекс • Нова Системы"}
        greeting={settings?.greeting || "Здравствуйте! Чем можем помочь?"}
      />
      <section className="panel explanation">
        <h2>Правила работы</h2>
        <p>
          Ответы только из базы знаний. Вопросы вне базы и просьбы о живом
          общении передаются оператору. Контакты сохраняются после согласия.
          Сообщение клиента ограничено 2 000 символами.
        </p>
        <p>
          Ключи провайдеров задаются на сервере через переменные окружения. Они
          не передаются в браузер.
        </p>
      </section>
    </>
  );
}
