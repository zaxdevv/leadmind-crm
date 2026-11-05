import { authenticated, demoLoginEnabled } from "@/lib/security";
import { Login } from "@/components/login";
import { Shell } from "@/components/shell";
export const dynamic = "force-dynamic";
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await authenticated())) return <Login demo={demoLoginEnabled()} />;
  return <Shell demo={!process.env.OPENAI_API_KEY}>{children}</Shell>;
}
