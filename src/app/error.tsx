"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="empty">
      <h1>Не удалось загрузить страницу</h1>
      <p>Проверьте подключение и повторите попытку.</p>
      <button onClick={reset}>Повторить</button>
    </main>
  );
}
