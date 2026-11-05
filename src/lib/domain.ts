export const stages = {
  new: "Новый",
  working: "В работе",
  qualified: "Квалифицирован",
  won: "Сделка",
  closed: "Закрыт",
} as const;
export const priorities = {
  cold: "Холодный",
  warm: "Тёплый",
  hot: "Горячий",
} as const;
export function qualify(text: string): keyof typeof priorities {
  if (/купить|заказать|срочно|договор|готов|запуст|нужен|хочу/i.test(text))
    return "hot";
  return /цен|стои|сколько|тариф|подключ|демо|интерес/i.test(text)
    ? "warm"
    : "cold";
}
export function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function wantsOperator(text: string) {
  return /оператор|менеджер|человек|специалист/i.test(text);
}
export function isInjection(text: string) {
  return /ignore.*instruction|игнорируй.*инструкц|system prompt|системн.*промпт|забудь.*правил/i.test(
    text,
  );
}
