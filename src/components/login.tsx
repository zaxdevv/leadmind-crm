"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { api } from "@/lib/client";
import { Brand } from "./brand";
export function Login({ demo }: { demo: boolean }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <main className="login-page">
      <Brand />
      <form
        className="login-card panel"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("/api/auth", "POST", {
              password: new FormData(e.currentTarget).get("password"),
            });
            router.refresh();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <ShieldCheck size={36} className="blue" />
        <h1>
          Ваш отдел продаж.
          <br />
          На одной странице.
        </h1>
        <p>
          {demo
            ? "Откройте CRM с вымышленными заявками и попробуйте весь цикл работы с клиентом."
            : "Войдите с паролем администратора."}
        </p>
        {!demo && (
          <label>
            Пароль
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
        )}
        <button disabled={busy}>
          {busy ? "Входим…" : demo ? "Войти в демо" : "Войти"}
          <ArrowRight size={17} />
        </button>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <small>
          Демо доступно посетителям. Используйте только тестовые контакты.
        </small>
      </form>
    </main>
  );
}
