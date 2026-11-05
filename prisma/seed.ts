import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const materials = [
  {
    id: "pricing",
    title: "Тарифы и стоимость",
    keywords: "цен стоим тариф бюджет оплат сколько",
    body: "Нова Системы автоматизирует продажи малого бизнеса. Старт — 30 000 ₽: чат-бот на сайте, база знаний и сбор заявок. Бизнес — 60 000 ₽: Telegram, CRM и передача оператору. Под ключ — от 100 000 ₽: индивидуальные интеграции и аналитика. Подписка на поддержку — от 5 000 ₽ в месяц, подключается по желанию. Итоговую смету согласуем после брифа.",
  },
  {
    id: "launch",
    title: "Сроки и процесс запуска",
    keywords: "срок запуст внедр подключ этап недел дней",
    body: "Запуск занимает от 7 до 14 рабочих дней после согласования базы знаний. Сначала проводим бриф, затем готовим сценарии и прототип, настраиваем интеграции, тестируем и обучаем команду. Для старта нужны описание услуг, ответы на частые вопросы и контакты ответственного сотрудника.",
  },
  {
    id: "channels",
    title: "Каналы и интеграции",
    keywords: "telegram телеграм whatsapp вотсап crm интеграц сайт amo битрикс",
    body: "Подключаем чат на сайте и Telegram. Для WhatsApp требуется отдельная настройка через официального провайдера WhatsApp Business API; стоимость провайдера рассчитывается отдельно. Передаём заявки в amoCRM, Битрикс24 или Google Sheets через согласованный webhook. Оператор видит всю историю диалога.",
  },
  {
    id: "support",
    title: "Поддержка и гарантии",
    keywords: "поддерж гаранти помощь работ обслуж",
    body: "После запуска предоставляем 30 дней исправления ошибок по согласованному заданию. Поддержка работает по будням с 10:00 до 19:00 по Москве. Новые функции оцениваем отдельно. Не обещаем фиксированный рост выручки: результат зависит от трафика, предложения и работы отдела продаж.",
  },
  {
    id: "privacy",
    title: "Данные и безопасность",
    keywords: "данн безопас персональ соглас конфиденц хран",
    body: "Контакты передаются менеджеру только после явного согласия клиента. Демо использует вымышленную компанию и тестовые записи. Не вводите реальные персональные данные в публичное демо. Для коммерческого запуска согласуются политика обработки, сроки хранения и размещение базы данных.",
  },
];
async function seed() {
  await db.$transaction(
    async (db) => {
      if (await db.initialization.findUnique({ where: { id: "demo-v1" } }))
        return;
      const existing =
        (await db.conversation.count()) ||
        (await db.document.count()) ||
        (await db.settings.count());
      await db.initialization.create({ data: { id: "demo-v1" } });
      if (existing) return;
      for (const doc of materials)
        await db.document.upsert({
          where: { id: doc.id },
          create: doc,
          update: {},
        });
      await db.settings.upsert({
        where: { id: "bot" },
        create: {},
        update: {},
      });
      if (await db.conversation.count()) return;
      const names = [
        "Анна Смирнова",
        "Михаил Волков",
        "Елена Морозова",
        "Артём Соколов",
        "Ольга Лебедева",
        "Дмитрий Орлов",
        "Мария Кузнецова",
        "Илья Попов",
      ];
      const companies = [
        "Студия Форма",
        "Мебельное бюро",
        "Школа Практика",
        "Сервис Точка",
        "Клиника Вектор",
        "Мастерская Север",
        "Ателье Линия",
        "Бюро Маршрут",
      ];
      const statuses = ["new", "working", "qualified", "won", "closed"];
      for (let i = 0; i < 32; i++) {
        const createdAt = new Date(
          Date.now() - (6 - (i % 7)) * 86400_000 - (i % 6) * 3600_000,
        );
        const doc = materials[i % materials.length];
        await db.conversation.create({
          data: {
            channel: i % 3 === 0 ? "Telegram" : "Сайт",
            mode: i % 7 === 0 ? "operator" : "bot",
            topic: doc.title,
            createdAt,
            messages: {
              create: [
                {
                  role: "user",
                  text: [
                    "Сколько стоит бот для нашей компании?",
                    "Хотим запустить автоматизацию продаж. Какие сроки?",
                    "Можно подключить Telegram и CRM?",
                    "Как устроена поддержка?",
                    "Где хранятся данные клиентов?",
                  ][i % 5],
                  createdAt,
                },
                {
                  role: "assistant",
                  text: doc.body,
                  sourceId: doc.id,
                  sourceTitle: doc.title,
                  responseMs: 850 + i * 37,
                  createdAt: new Date(createdAt.getTime() + 850 + i * 37),
                },
              ],
            },
            ...(i < 20
              ? {
                  lead: {
                    create: {
                      name: names[i % 8],
                      company: companies[i % 8],
                      contact: `demo${i + 1}@example.com`,
                      status: statuses[i % 5],
                      priority:
                        i % 3 === 0 ? "hot" : i % 3 === 1 ? "warm" : "cold",
                      tags: i % 2 ? "Автоматизация, Telegram" : "Сайт, CRM",
                      notes:
                        "Демонстрационная заявка. Обсудить задачи отдела продаж и согласовать время встречи.",
                      consentAt: createdAt,
                      createdAt,
                    },
                  },
                }
              : {}),
          },
        });
      }
    },
    { timeout: 30000 },
  );
}
seed().finally(() => db.$disconnect());
