import { cookies } from "next/headers";
import { checkOrigin, errorResponse, jsonBody, HttpError } from "@/lib/http";
import { equals, rateLimit, sessionToken } from "@/lib/security";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (
      !rateLimit(
        `login:${request.headers.get("x-forwarded-for") || "local"}`,
        10,
      )
    )
      throw new HttpError(429, "Попробуйте через минуту");
    const body = await jsonBody(request);
    const demo =
      process.env.DEMO_LOGIN_ENABLED === "true" ||
      (process.env.NODE_ENV !== "production" &&
        process.env.DEMO_LOGIN_ENABLED !== "false");
    if (
      !demo &&
      (!process.env.ADMIN_PASSWORD ||
        typeof body.password !== "string" ||
        !equals(body.password, process.env.ADMIN_PASSWORD))
    )
      throw new HttpError(401, "Неверный пароль");
    (await cookies()).set("leadmind_session", sessionToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: new URL(request.url).protocol === "https:",
      maxAge: 28800,
      path: "/",
    });
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    (await cookies()).delete("leadmind_session");
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
