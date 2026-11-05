import Link from "next/link";
export default function NotFound() {
  return (
    <main className="empty">
      <h1>Страница не найдена</h1>
      <p>Возможно, запись была удалена.</p>
      <Link className="button" href="/dashboard">
        Открыть CRM
      </Link>
    </main>
  );
}
