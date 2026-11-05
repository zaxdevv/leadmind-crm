import { Layers3 } from "lucide-react";
import Link from "next/link";
export function Brand() {
  return (
    <Link href="/" className="brand">
      <span className="brand-icon">
        <Layers3 size={21} />
      </span>
      LeadMind<span className="brand-crm">CRM</span>
    </Link>
  );
}
