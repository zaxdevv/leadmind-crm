import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "LeadMind CRM — каждый диалог ближе к сделке",
    template: "%s · LeadMind CRM",
  },
  description:
    "ИИ-консультант, база знаний и CRM в одном рабочем пространстве. Демонстрационный проект zaxdev.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
