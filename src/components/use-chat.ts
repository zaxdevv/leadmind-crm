"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/client";

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
type RestoreState = "loading" | "failed" | "ready";
export function useChat() {
  const [chat, setChat] = useState<ChatData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [restoreState, setRestoreState] = useState<RestoreState>("loading");
  const session = useRef({
    generation: 0,
    token: undefined as string | undefined,
    busy: false,
    ready: false,
    reading: false,
  });
  const requests = useRef(new Set<AbortController>());

  const invalidate = useCallback(() => {
    session.current.generation++;
    for (const controller of requests.current) controller.abort();
    requests.current.clear();
    session.current.busy = false;
    session.current.reading = false;
  }, []);

  const restore = useCallback(async () => {
    invalidate();
    const active = session.current;
    const generation = active.generation;
    const token = localStorage.getItem("leadmind-chat") || undefined;
    active.token = token;
    active.ready = !token;
    setError("");
    setRestoreState(token ? "loading" : "ready");
    if (!token) return;
    const controller = new AbortController();
    requests.current.add(controller);
    try {
      const result = await api<ChatData>(
        "/api/chat",
        "POST",
        { token },
        controller.signal,
      );
      if (generation !== active.generation) return;
      setChat(result);
      active.ready = true;
      setRestoreState("ready");
    } catch (e) {
      if (generation !== active.generation) return;
      if (e instanceof ApiError && e.status === 404) {
        localStorage.removeItem("leadmind-chat");
        active.token = undefined;
        active.ready = true;
        setChat(null);
        setRestoreState("ready");
      } else {
        setError(
          "Не удалось загрузить историю. Проверьте соединение и повторите восстановление.",
        );
        setRestoreState("failed");
      }
    } finally {
      requests.current.delete(controller);
    }
  }, [invalidate]);

  useEffect(() => {
    let disposed = false;
    queueMicrotask(() => {
      if (!disposed) void restore();
    });
    return () => {
      disposed = true;
      invalidate();
    };
  }, [restore, invalidate]);

  const token = chat?.token;
  useEffect(() => {
    if (!token) return;
    const active = session.current;
    const timer = setInterval(async () => {
      if (!active.ready || active.busy || active.reading) return;
      const generation = active.generation;
      active.reading = true;
      const controller = new AbortController();
      requests.current.add(controller);
      try {
        const result = await api<ChatData>(
          "/api/chat",
          "POST",
          { token },
          controller.signal,
        );
        if (generation === active.generation && !active.busy) setChat(result);
      } catch {
      } finally {
        requests.current.delete(controller);
        if (generation === active.generation) active.reading = false;
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [token]);

  async function submit(body: object) {
    const active = session.current;
    if (!active.ready || active.busy) return false;
    invalidate();
    const generation = active.generation;
    const controller = new AbortController();
    requests.current.add(controller);
    active.busy = true;
    setBusy(true);
    setError("");
    try {
      const result = await api<ChatData>(
        "/api/chat",
        "POST",
        { token: active.token, ...body },
        controller.signal,
      );
      if (generation !== active.generation) return false;
      active.token = result.token;
      setChat(result);
      localStorage.setItem("leadmind-chat", result.token);
      return true;
    } catch (e) {
      if (generation === active.generation)
        setError(
          e instanceof ApiError
            ? e.message
            : "Не удалось отправить сообщение. Проверьте соединение и повторите.",
        );
      return false;
    } finally {
      requests.current.delete(controller);
      if (generation === active.generation) {
        active.busy = false;
        setBusy(false);
      }
    }
  }
  function reset() {
    invalidate();
    session.current.token = undefined;
    session.current.ready = true;
    localStorage.removeItem("leadmind-chat");
    setChat(null);
    setBusy(false);
    setError("");
    setRestoreState("ready");
  }
  return { chat, busy, error, restoreState, restore, submit, reset };
}
