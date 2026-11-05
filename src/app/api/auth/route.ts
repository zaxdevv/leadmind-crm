import { cookies } from "next/headers";
import { checkOrigin, errorResponse, jsonBody, HttpError } from "@/lib/http";
import {
  demoLoginEnabled,
  equals,
  rateLimit,
  rateLimitClient,
  sessionToken,
} from "@/lib/security";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (
      !rateLimit("login:installation", 30) ||
      !rateLimit(`login:${rateLimitClient(request)}`, 10)
    )
      throw new HttpError(429, "Попробуйте через минуту");
    const body = await jsonBody(request);
    const demo = demoLoginEnabled();
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
