import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users } from "lucide-react";

export function AdminNav() {
  return (
    <nav className="flex gap-2">
      <Button variant="ghost" asChild className="text-slate-300"><Link href="/admin/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link></Button>
      <Button variant="ghost" asChild className="text-slate-300"><Link href="/admin/users"><Users className="mr-2 h-4 w-4" />Usuários</Link></Button>
    </nav>
  );
}
