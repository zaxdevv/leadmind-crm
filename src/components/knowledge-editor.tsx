"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, Pencil, Trash2, X } from "lucide-react";
import { Modal } from "./modal";
import { api } from "@/lib/client";
type Material = { id: string; title: string; body: string; keywords: string };
export function KnowledgeEditor({ documents }: { documents: Material[] }) {
  const [editing, setEditing] = useState<Material | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const router = useRouter();
  const filtered = documents.filter((d) =>
    (d.title + " " + d.body).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="knowledge-toolbar">
        <label className="search-box">
          <input
            aria-label="Поиск материалов"
            placeholder="Найти в базе знаний…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <button
          onClick={() => {
            setEditing({ id: "", title: "", body: "", keywords: "" });
            setError("");
          }}
        >
          <Plus size={16} />
          Добавить материал
        </button>
      </div>
      <div className="knowledge-grid">
        {filtered.map((doc) => (
          <article className="panel knowledge-card" key={doc.id}>
            <span className="document-icon">
              <BookOpen size={22} />
            </span>
            <h2>{doc.title}</h2>
            <p>{doc.body}</p>
            <footer>
              <span>{doc.body.length} символов</span>
              <button
                className="icon-button"
                aria-label={`Изменить ${doc.title}`}
                onClick={() => {
                  setEditing(doc);
                  setError("");
                }}
              >
                <Pencil size={16} />
              </button>
              <button
                className="icon-button"
                aria-label={`Удалить ${doc.title}`}
                onClick={() => setDeleteId(doc.id)}
              >
                <Trash2 size={16} />
              </button>
            </footer>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <div className="panel empty">
          Материалов не найдено. Добавьте первый документ или измените запрос.
        </div>
      )}
      {editing && (
        <Modal label="Редактор материала" onClose={() => setEditing(null)}>
          <div className="row spread">
            <h2>{editing.id ? "Изменить материал" : "Новый материал"}</h2>
            <button
              className="icon-button"
              aria-label="Закрыть"
              onClick={() => setEditing(null)}
            >
              <X size={18} />
            </button>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              const data = Object.fromEntries(new FormData(e.currentTarget));
              try {
                await api(
                  `/api/admin/knowledge${editing.id ? "/" + editing.id : ""}`,
                  editing.id ? "PATCH" : "POST",
                  data,
                );
                setEditing(null);
                router.refresh();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Название
              <input
                autoFocus
                name="title"
                required
                minLength={3}
                maxLength={100}
                defaultValue={editing.title}
              />
            </label>
            <label>
              Текст источника
              <textarea
                name="body"
                required
                minLength={20}
                maxLength={10000}
                rows={9}
                defaultValue={editing.body}
              />
            </label>
            <label>
              Ключевые слова
              <input
                aria-label="Ключевые слова"
                name="keywords"
                required
                minLength={3}
                maxLength={500}
                defaultValue={editing.keywords}
                placeholder="стоимость цена тариф"
              />
              <small>
                Укажите основы слов через пробел для локального поиска.
              </small>
            </label>
            <button disabled={busy}>Сохранить материал</button>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
          </form>
        </Modal>
      )}
      {deleteId && (
        <Modal label="Удалить материал" onClose={() => setDeleteId("")}>
          <h2>Удалить материал?</h2>
          <p>
            Бот перестанет использовать его для новых ответов. История переписки
            сохранится.
          </p>
          <div className="row">
            <button
              onClick={async () => {
                try {
                  await api(`/api/admin/knowledge/${deleteId}`, "DELETE");
                  setDeleteId("");
                  router.refresh();
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Удалить
            </button>
            <button className="secondary" onClick={() => setDeleteId("")}>
              Отмена
            </button>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </Modal>
      )}
    </>
  );
}
