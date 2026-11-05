"use client";
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  UserRound,
  ArrowUpRight,
  BookOpen,
  RotateCcw,
  CheckCheck,
} from "lucide-react";
import { api } from "@/lib/client";
type Message = {
  id: string;
  role: string;
  text: string;
  sourceId: string | null;
  sourceTitle: string | null;
};
type ChatData = {
  id: string;
  token: string;
  mode: string;
  messages: Message[];
  lead: { id: string } | null;
};
export function Chat({ name, greeting }: { name: string; greeting: string }) {
  const [chat, setChat] = useState<ChatData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [contactOpen, setContactOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const conversationToken = chat?.token;
  async function submit(body: object) {
    setBusy(true);
    setError("");
    try {
      const result = await api<ChatData>("/api/chat", "POST", {
        token: chat?.token,
        ...body,
      });
      setChat(result);
      localStorage.setItem("leadmind-chat", result.token);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    const token = localStorage.getItem("leadmind-chat");
    if (token)
      api<ChatData>("/api/chat", "POST", { token })
        .then(setChat)
        .catch(() => localStorage.removeItem("leadmind-chat"));
  }, []);
  useEffect(() => {
    if (!conversationToken) return;
    let active = true;
    const timer = setInterval(() => {
      api<ChatData>("/api/chat", "POST", { token: conversationToken })
        .then((result) => {
          if (active) setChat(result);
        })
        .catch(() => {});
    }, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [conversationToken]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chat?.messages.length, busy]);
  const messages = chat?.messages || [
    {
      id: "greeting",
      role: "assistant",
      text: greeting,
      sourceId: null,
      sourceTitle: null,
    },
  ];
  return (
    <section className="chat-window">
      <header className="chat-header">
        <span className="bot-avatar">
          <Bot size={23} />
        </span>
        <div>
          <strong>{name}</strong>
          <small>
            <span className="status-dot" />
            {chat?.mode === "operator"
              ? "Диалог передан оператору"
              : "Онлайн · отвечает по базе знаний"}
          </small>
        </div>
        <button
          className="icon-button"
          aria-label="Новый диалог"
          title="Новый диалог"
          onClick={() => {
            localStorage.removeItem("leadmind-chat");
            setChat(null);
            setError("");
            setContactOpen(false);
          }}
        >
          <RotateCcw size={17} />
        </button>
      </header>
      <div className="chat-messages" aria-live="polite">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`message ${m.role === "user" ? "from-user" : "from-bot"}`}
          >
            <small>
              {m.role === "user"
                ? "Вы"
                : m.role === "operator"
                  ? "Менеджер"
                  : "Алекс · помощник"}
            </small>
            <div>{m.text}</div>
            {m.sourceId && (
              <a
                href={`/api/sources/${m.sourceId}`}
                target="_blank"
                rel="noreferrer"
                className="source"
              >
                <BookOpen size={12} />
                {m.sourceTitle}
                <ArrowUpRight size={12} />
              </a>
            )}
          </div>
        ))}
        {busy && (
          <div className="typing" role="status">
            Помощник печатает<span>…</span>
          </div>
        )}
        <div ref={bottom} />
      </div>
      <div className="chat-controls">
        {!chat?.lead && !contactOpen && (
          <>
            <div className="quick-questions">
              {["Сколько стоит?", "Какие сроки?", "Подключить Telegram"].map(
                (text) => (
                  <button
                    className="chip"
                    key={text}
                    disabled={busy}
                    onClick={() => submit({ text })}
                  >
                    {text}
                  </button>
                ),
              )}
            </div>
            <div className="chat-actions">
              <button
                className="text-link"
                onClick={() => setContactOpen(true)}
              >
                Оставить заявку <ArrowUpRight size={14} />
              </button>
              <button
                className="text-link muted"
                disabled={busy}
                onClick={() => submit({ text: "Хочу поговорить с оператором" })}
              >
                <UserRound size={14} />
                Позвать оператора
              </button>
            </div>
          </>
        )}
        {chat?.lead && (
          <p className="success">
            <CheckCheck size={16} />
            Заявка передана менеджеру
          </p>
        )}
        {contactOpen && !chat?.lead && (
          <form
            className="contact-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              if (
                await submit({
                  contact: {
                    name: form.get("name"),
                    contact: form.get("contact"),
                    company: form.get("company"),
                    consent: form.get("consent") === "on",
                  },
                })
              )
                setContactOpen(false);
            }}
          >
            <strong>Обсудим вашу задачу</strong>
            <div className="form-grid">
              <label>
                Имя
                <input
                  name="name"
                  minLength={2}
                  maxLength={80}
                  required
                  placeholder="Как к вам обращаться"
                />
              </label>
              <label>
                Контакт
                <input
                  name="contact"
                  required
                  maxLength={120}
                  placeholder="Email, телефон или @telegram"
                />
              </label>
            </div>
            <label>
              Компания
              <input
                name="company"
                maxLength={120}
                placeholder="Необязательно"
              />
            </label>
            <label className="checkbox">
              <input type="checkbox" name="consent" required />
              Согласен на обработку контактов для ответа на заявку.{" "}
              <a href="/privacy" target="_blank">
                Условия
              </a>
            </label>
            <div className="row">
              <button disabled={busy}>Отправить заявку</button>
              <button
                type="button"
                className="secondary"
                onClick={() => setContactOpen(false)}
              >
                Отмена
              </button>
            </div>
          </form>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <form
          className="chat-input"
          onSubmit={async (e) => {
            e.preventDefault();
            if (draft.trim() && (await submit({ text: draft }))) setDraft("");
          }}
        >
          <input
            aria-label="Сообщение"
            placeholder="Напишите ваш вопрос…"
            value={draft}
            maxLength={2000}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            aria-label="Отправить сообщение"
            disabled={busy || !draft.trim()}
          >
            <Send size={18} />
          </button>
        </form>
        <small className="chat-footnote">
          LeadMind · Пожалуйста, используйте тестовые контакты
        </small>
      </div>
    </section>
  );
}
