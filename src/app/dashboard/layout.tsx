import { authenticated } from "@/lib/security";
import { Login } from "@/components/login";
import { Shell } from "@/components/shell";
export const dynamic = "force-dynamic";
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await authenticated()))
    return (
      <Login
        demo={
          process.env.DEMO_LOGIN_ENABLED === "true" ||
          (process.env.NODE_ENV !== "production" &&
            process.env.DEMO_LOGIN_ENABLED !== "false")
        }
      />
    );
  return <Shell demo={!process.env.OPENAI_API_KEY}>{children}</Shell>;
}
