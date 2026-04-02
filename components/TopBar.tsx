"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/lib/i18n";

export default function TopBar() {
  const { lang, setLang } = useTranslation();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      setUser(data);
    });
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  if (!user) return null;

  const initials = user.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase() || "??";

  return (
    <div style={{
      position: "fixed", top: 0, left: 220, right: 0, height: 52, zIndex: 100,
      background: "#13171e", borderBottom: "1px solid #252b38",
      display: "flex", alignItems: "center", justifyContent: "flex-end",
      gap: 12, padding: "0 24px",
    }}>
      {/* Language switcher */}
      <div style={{ display: "flex", gap: 4 }}>
        {(["en","tr","ar"] as const).map(l => (
          <button key={l} onClick={() => setLang(l)} style={{
            padding: "4px 10px", borderRadius: 6, border: "1px solid",
            borderColor: lang === l ? "#3b82f6" : "#252b38",
            background: lang === l ? "#1e3a5f" : "transparent",
            color: lang === l ? "#3b82f6" : "#5c6478",
            fontSize: 11, fontWeight: 700, cursor: "pointer",
          }}>{l.toUpperCase()}</button>
        ))}
      </div>

      <div style={{ width: 1, height: 24, background: "#252b38" }} />

      {/* User info */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{initials}</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.3 }}>{user.full_name}</div>
          <div style={{ fontSize: 10, color: "#5c6478", lineHeight: 1.3 }}>{user.role?.replace(/_/g," ").toUpperCase()}</div>
        </div>
      </div>

      <div style={{ width: 1, height: 24, background: "#252b38" }} />

      {/* Sign out */}
      <button onClick={handleLogout} style={{
        padding: "6px 14px", background: "transparent", border: "1px solid #252b38",
        borderRadius: 7, color: "#8891a4", fontSize: 12, cursor: "pointer",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor="#ef4444"; (e.currentTarget as HTMLButtonElement).style.color="#ef4444"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor="#252b38"; (e.currentTarget as HTMLButtonElement).style.color="#8891a4"; }}
      >Sign Out</button>
    </div>
  );
}
