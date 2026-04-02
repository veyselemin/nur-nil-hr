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
    ...( user.role === "admin" ? [{ href: "/activity", label: "Activity Monitor" }] : []),
    ...( user.role === "admin" ? [{ href: "/settings", label: t("nav.settings") }] : []),
  ];

  return (
    <>
      {/* ── Fixed Top-Right Bar ── */}
      <div style={{
        position: "fixed", top: 0, right: 0, zIndex: 100,
        height: 52, display: "flex", alignItems: "center", gap: 10,
        padding: "0 24px",
        background: "#13171e",
        borderBottom: "1px solid #252b38",
        borderLeft: "1px solid #252b38",
        left: 220,
      }}>
        {/* Language buttons */}
        <div style={{ display: "flex", gap: 4 }}>
          {(["en","tr","ar"] as const).map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding: "4px 10px", borderRadius: 6, border: "1px solid",
              borderColor: lang === l ? "#3b82f6" : "#252b38",
              background: lang === l ? "#1e3a5f" : "transparent",
              color: lang === l ? "#3b82f6" : "#5c6478",
              fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit, sans-serif"
            }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: "#252b38" }} />

        {/* User info */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "#fff"
          }}>
            {user.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.2 }}>{user.full_name}</div>
            <div style={{ fontSize: 10, color: "#5c6478" }}>{user.role.replace(/_/g," ").toUpperCase()}</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: "#252b38" }} />

        {/* Sign out */}
        <button onClick={handleLogout} style={{
          padding: "5px 12px", background: "transparent",
          border: "1px solid #252b38", borderRadius: 6,
          color: "#8891a4", fontSize: 12, cursor: "pointer",
          fontFamily: "Outfit, sans-serif", display: "flex", alignItems: "center", gap: 5
        }}>
          <span style={{ fontSize: 13 }}>→</span> {t("nav.signout")}
        </button>
      </div>

      {/* ── Sidebar ── */}
      <div style={{
        width: 220, background: "#13171e", borderRight: "1px solid #252b38",
        display: "flex", flexDirection: "column", minHeight: "100vh",
        flexShrink: 0, position: "fixed", top: 0, left: 0, zIndex: 99
      }}>
        <div style={{ padding: "20px 16px", borderBottom: "1px solid #252b38", marginTop: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>NUR NIL TEKSTIL</div>
          <div style={{ fontSize: 10, color: "#5c6478", fontWeight: 500, marginTop: 2 }}>HR PLATFORM</div>
        </div>

        <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
          {navItems.map(item => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{
                display: "flex", alignItems: "center", padding: "10px 20px",
                color: active ? "#e2e8f0" : "#8891a4", textDecoration: "none",
                fontSize: 13, fontWeight: active ? 600 : 400,
                background: active ? "#1a1f2a" : "transparent",
                borderLeft: active ? "3px solid #3b82f6" : "3px solid transparent"
              }}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Spacer so page content doesn't go under the fixed top bar ── */}
      <div style={{ position: "fixed", top: 0, left: 0, width: 220, height: 52, background: "#13171e", zIndex: 100, borderBottom: "1px solid #252b38" }} />
    </>
  );
}
