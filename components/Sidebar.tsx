"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/lib/i18n";

export default function Sidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      setUser(data);
    });
  }, []);

  if (!user) return null;

  const navItems = [
    { href: "/dashboard", label: t("nav.dashboard") },
    { href: "/employees", label: t("nav.employees") },
    { href: "/attendance", label: t("nav.attendance") },
    { href: "/leave", label: t("nav.leave") },
    { href: "/disciplinary", label: t("nav.disciplinary") },
    { href: "/documents", label: t("nav.documents") },
    { href: "/payroll", label: t("nav.payroll") },
    { href: "/sections", label: t("nav.sections") },
    ...(["admin","hr_manager"].includes(user.role) ? [{ href: "/approvals", label: t("nav.approvals") }] : []),
    ...(user.role === "admin" ? [{ href: "/activity", label: "Activity Monitor" }] : []),
    ...(user.role === "admin" ? [{ href: "/settings", label: t("nav.settings") }] : []),
  ];

  return (
    <aside style={{
      position: "fixed", top: 0, left: 0, bottom: 0, width: 220,
      background: "#13171e", borderRight: "1px solid #252b38",
      display: "flex", flexDirection: "column", zIndex: 99,
    }}>
      {/* Logo — same height as TopBar (52px) */}
      <div style={{ height: 52, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 16px", borderBottom: "1px solid #252b38" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>NUR NIL TEKSTIL</div>
        <div style={{ fontSize: 10, color: "#5c6478", fontWeight: 500, marginTop: 2 }}>HR PLATFORM</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
        {navItems.map(item => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", padding: "10px 20px",
              color: active ? "#e2e8f0" : "#8891a4", textDecoration: "none",
              fontSize: 13, fontWeight: active ? 600 : 400,
              background: active ? "#1a1f2a" : "transparent",
              borderLeft: active ? "3px solid #3b82f6" : "3px solid transparent",
            }}>{item.label}</Link>
          );
        })}
      </nav>
    </aside>
  );
}
