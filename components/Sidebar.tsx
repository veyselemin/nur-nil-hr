"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/lib/i18n";

export default function Sidebar() {
  const { t, lang, setLang } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      setUser(data);
    });
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

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
    ...( ["admin","hr_manager"].includes(user.role) ? [{ href: "/approvals", label: t("nav.approvals") }] : []),
    ...( user.role === "admin" ? [{ href: "/settings", label: t("nav.settings") }] : []),
  ];

  return (
    <div style={{ width: 220, background: "#13171e", borderRight: "1px solid #252b38", display: "flex", flexDirection: "column", minHeight: "100vh", flexShrink: 0 }}>
      <div style={{ padding: "20px 16px", borderBottom: "1px solid #252b38" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>NUR NIL TEKSTIL</div>
        <div style={{ fontSize: 10, color: "#5c6478", fontWeight: 500, marginTop: 2 }}>HR PLATFORM</div>
      </div>

      <nav style={{ flex: 1, padding: "12px 0" }}>
        {navItems.map(item => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{ display: "flex", alignItems: "center", padding: "10px 20px", color: active ? "#e2e8f0" : "#8891a4", textDecoration: "none", fontSize: 13, fontWeight: active ? 600 : 400, background: active ? "#1a1f2a" : "transparent", borderLeft: active ? "3px solid #3b82f6" : "3px solid transparent" }}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "16px", borderTop: "1px solid #252b38" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {(["en","tr","ar"] as const).map(l => (
            <button key={l} onClick={() => setLang(l)} style={{ flex: 1, padding: "5px 0", borderRadius: 6, border: "1px solid", borderColor: lang === l ? "#3b82f6" : "#252b38", background: lang === l ? "#1e3a5f" : "transparent", color: lang === l ? "#3b82f6" : "#5c6478", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#8891a4", marginBottom: 4 }}>{user.full_name}</div>
        <div style={{ fontSize: 11, color: "#5c6478", marginBottom: 10 }}>{user.role.replace("_"," ").toUpperCase()}</div>
        <button onClick={handleLogout} style={{ width: "100%", padding: "8px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 7, color: "#8891a4", fontSize: 12, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>
          {t("nav.signout")}
        </button>
      </div>
    </div>
  );
}
