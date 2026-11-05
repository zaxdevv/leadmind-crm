"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, UserRound } from "lucide-react";
import { api } from "@/lib/client";
type OperatorConversation = {
  id: string;
  mode: string;
  messages: {
    id: string;
    role: string;
    text: string;
    sourceTitle: string | null;
  }[];
};
export function OperatorChat({
  conversation,
}: {
  conversation: OperatorConversation;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(timer);
  }, [router]);
  async function changeMode() {
    setError("");
    try {
      await api(`/api/admin/conversations/${conversation.id}`, "PATCH", {
        mode: conversation.mode === "operator" ? "bot" : "operator",
      });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <section className="panel operator-panel">
      <div className="panel-heading">
        <div>
          <h2>История диалога</h2>
          <p>
            {conversation.mode === "operator"
              ? "Оператор ведёт разговор"
              : "Отвечает помощник"}
          </p>
        </div>
        <button className="secondary" onClick={changeMode}>
          <UserRound size={15} />
          {conversation.mode === "operator" ? "Вернуть боту" : "Принять диалог"}
        </button>
      </div>
      <div className="operator-messages">
        {conversation.messages.map((m) => (
          <div
            key={m.id}
            className={`message ${m.role === "user" ? "from-user" : "from-bot"}`}
          >
            <small>
              {m.role === "user"
                ? "Клиент"
                : m.role === "operator"
                  ? "Менеджер"
                  : "Помощник"}
            </small>
            <div>{m.text}</div>
            {m.sourceTitle && (
              <small className="source">Источник: {m.sourceTitle}</small>
            )}
          </div>
        ))}
      </div>
      <form
        className="operator-composer"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const form = e.currentTarget;
          const text = new FormData(form).get("text");
          try {
            await api(`/api/admin/conversations/${conversation.id}`, "POST", {
              text,
            });
            form.reset();
            router.refresh();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="sr-only" htmlFor="operator-message">
          Сообщение оператора
        </label>
        <textarea
          id="operator-message"
          name="text"
          required
          maxLength={2000}
          placeholder={
            conversation.mode === "operator"
              ? "Ответьте клиенту от имени менеджера…"
              : "Примите диалог, чтобы ответить клиенту"
          }
          disabled={conversation.mode !== "operator"}
          rows={2}
        />
        <button disabled={busy || conversation.mode !== "operator"}>
          <Send size={16} />
          Отправить
        </button>
      </form>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  );
}
