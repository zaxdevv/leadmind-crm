"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lead } from "@prisma/client";
import { api } from "@/lib/client";
import { priorities, stages } from "@/lib/domain";
export function LeadEditor({
  lead,
}: {
  lead: Omit<Lead, "createdAt" | "consentAt">;
}) {
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      className="panel detail-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setNotice("");
        const data = new FormData(e.currentTarget);
        try {
          await api(
            `/api/admin/leads/${lead.id}`,
            "PATCH",
            Object.fromEntries(data),
          );
          setNotice("Изменения сохранены");
          router.refresh();
        } catch (e) {
          setNotice((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>Карточка лида</h2>
      <dl className="contact-details">
        <div>
          <dt>Контакт</dt>
          <dd>{lead.contact}</dd>
        </div>
        <div>
          <dt>Компания</dt>
          <dd>{lead.company || "Не указана"}</dd>
        </div>
      </dl>
      <label>
        Стадия
        <select aria-label="Стадия" name="status" defaultValue={lead.status}>
          {Object.entries(stages).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label>
        Приоритет
        <select
          aria-label="Приоритет"
          name="priority"
          defaultValue={lead.priority}
        >
          {Object.entries(priorities).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label>
        Теги через запятую
        <input name="tags" defaultValue={lead.tags} maxLength={300} />
      </label>
      <label>
        Заметки менеджера
        <textarea
          name="notes"
          rows={5}
          defaultValue={lead.notes}
          maxLength={5000}
        />
      </label>
      <button disabled={busy}>
        {busy ? "Сохраняем…" : "Сохранить изменения"}
      </button>
      <p role="status" className="form-notice">
        {notice}
      </p>
    </form>
  );
}
