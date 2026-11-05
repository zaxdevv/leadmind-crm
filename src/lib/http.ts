import { ZodError } from "zod";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function jsonBody(request: Request) {
  const text = await request.text();
  if (text.length > 20000) throw new HttpError(413, "Слишком большой запрос");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Некорректный JSON");
  }
}
export function errorResponse(error: unknown) {
  if (error instanceof HttpError)
    return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError)
    return Response.json(
      {
        error: "Проверьте поля формы",
        fields: error.issues.map((i) => i.path.join(".")),
      },
      { status: 422 },
    );
  return Response.json(
    { error: "Не удалось выполнить запрос. Попробуйте ещё раз." },
    { status: 500 },
  );
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const publicHost = request.headers.get("host") || new URL(request.url).host;
  if (new URL(origin).host !== publicHost && origin !== process.env.APP_URL)
    throw new HttpError(403, "Запрос с другого сайта запрещён");
}
