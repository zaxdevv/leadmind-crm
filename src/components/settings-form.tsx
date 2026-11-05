"use client";
import { useState } from "react";
import { api } from "@/lib/client";
export function SettingsForm({
  name,
  greeting,
}: {
  name: string;
  greeting: string;
}) {
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="panel settings-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await api(
            "/api/admin/settings",
            "PATCH",
            Object.fromEntries(new FormData(e.currentTarget)),
          );
          setNotice(
            "Настройки сохранены. Приветствие появится в новых диалогах.",
          );
        } catch (e) {
          setNotice((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>Голос вашего бизнеса</h2>
      <p>Имя и первое сообщение, которые увидит клиент.</p>
      <label>
        Имя помощника
        <input
          name="name"
          defaultValue={name}
          required
          minLength={2}
          maxLength={80}
        />
      </label>
      <label>
        Приветственное сообщение
        <textarea
          name="greeting"
          defaultValue={greeting}
          required
          minLength={10}
          maxLength={600}
          rows={5}
        />
      </label>
      <button disabled={busy}>Сохранить настройки</button>
      <p role="status" className="form-notice">
        {notice}
      </p>
    </form>
  );
}
