#!/bin/bash
cd ~/nur-nil-hr
echo "Creating folders..."
mkdir -p app/login app/dashboard app/employees app/attendance app/leave app/approvals app/disciplinary app/documents app/payroll app/sections app/settings components lib
echo "Creating lib/supabase.ts..."
cat > lib/supabase.ts << 'F1'
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
F1
echo "Creating lib/types.ts..."
cat > lib/types.ts << 'F2'
export type UserRole = "admin" | "hr_manager" | "hr_employee" | "section_manager";
export type EmployeeStatus = "active" | "on_leave" | "absent" | "suspended" | "terminated";
export interface Section { id: number; name: string; description: string; is_active: boolean; }
export interface Employee { id: number; first_name: string; last_name: string; full_name: string; tc_kimlik_no: string; phone: string; section_id: number; position: string; status: EmployeeStatus; start_date: string; gross_salary: number; annual_leave_total: number; annual_leave_used: number; performance_score: number; is_clocked_in: boolean; is_approved: boolean; sections?: Section; }
export interface Profile { id: string; full_name: string; email: string; role: UserRole; section_id: number | null; }
F2
echo "Creating lib/auth.tsx..."
cat > lib/auth.tsx << 'F3'
"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "./supabase";
import { UserRole } from "./types";
interface AuthUser { id: string; email: string; full_name: string; role: UserRole; section_id: number | null; }
interface AuthContextType { user: AuthUser | null; loading: boolean; signIn: (email: string, password: string) => Promise<string | null>; signOut: () => Promise<void>; }
const AuthContext = createContext<AuthContextType>({ user: null, loading: true, signIn: async () => null, signOut: async () => {} });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { checkUser(); const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { checkUser(); }); return () => subscription.unsubscribe(); }, []);
  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        if (profile) { setUser({ id: profile.id, email: profile.email, full_name: profile.full_name, role: profile.role, section_id: profile.section_id }); } else { setUser(null); }
      } else { setUser(null); }
    } catch { setUser(null); }
    setLoading(false);
  }
  async function signIn(email: string, password: string) { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) return error.message; await checkUser(); return null; }
  async function signOut() { await supabase.auth.signOut(); setUser(null); }
  return (<AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>);
}
export function useAuth() { return useContext(AuthContext); }
F3
echo "Creating components/Sidebar.tsx..."
cat > components/Sidebar.tsx << 'F4'
"use client";
import { useAuth } from "../lib/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
const allNav = [
  { href: "/dashboard", label: "Dashboard", icon: "D", roles: null as string[] | null },
  { href: "/employees", label: "Employees", icon: "E", roles: null as string[] | null },
  { href: "/attendance", label: "Attendance", icon: "A", roles: null as string[] | null },
  { href: "/leave", label: "Leave Mgmt", icon: "L", roles: null as string[] | null },
  { href: "/approvals", label: "Approvals", icon: "V", roles: ["admin", "hr_manager"] },
  { href: "/disciplinary", label: "Disciplinary", icon: "!", roles: null as string[] | null },
  { href: "/documents", label: "Documents", icon: "F", roles: null as string[] | null },
  { href: "/payroll", label: "Payroll", icon: "$", roles: ["admin", "hr_manager", "hr_employee"] },
  { href: "/sections", label: "Sections", icon: "S", roles: null as string[] | null },
  { href: "/settings", label: "Settings", icon: "G", roles: ["admin"] },
];
export default function Sidebar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  if (!user) return null;
  const navItems = allNav.filter((item) => !item.roles || item.roles.includes(user.role));
  const roleLabels: Record<string, string> = { admin: "System Admin", hr_manager: "HR Manager", hr_employee: "HR Personnel", section_manager: "Section Manager" };
  return (
    <aside style={{ width: 240, minWidth: 240, background: "#13171e", borderRight: "1px solid #252b38", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100, fontFamily: "Outfit, sans-serif" }}>
      <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid #252b38" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #3b82f6, #6366f1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 15, fontWeight: 800 }}>N</span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e8eaf0" }}>NUR NIL TEKSTIL</div>
            <div style={{ fontSize: 10, color: "#5c6478", letterSpacing: "0.08em" }}>HR PLATFORM</div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" as const }}>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", textDecoration: "none", background: active ? "rgba(59,130,246,0.12)" : "transparent", border: active ? "1px solid rgba(59,130,246,0.15)" : "1px solid transparent", borderRadius: 10, color: active ? "#3b82f6" : "#8891a4", fontSize: 13, fontWeight: active ? 600 : 400, marginBottom: 2 }}>
              <span style={{ width: 24, height: 24, borderRadius: 6, background: active ? "rgba(59,130,246,0.2)" : "#1a1f2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: active ? "#3b82f6" : "#5c6478" }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div style={{ padding: "16px 14px", borderTop: "1px solid #252b38" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
            {user.full_name.split(" ").map((n: string) => n[0]).join("")}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e8eaf0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{user.full_name}</div>
            <div style={{ fontSize: 11, color: "#5c6478" }}>{roleLabels[user.role]}</div>
          </div>
        </div>
        <button onClick={signOut} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 8, color: "#8891a4", fontSize: 12, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>Sign Out</button>
      </div>
    </aside>
  );
}
F4
echo "Creating app/layout.tsx..."
cat > app/layout.tsx << 'F5'
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../lib/auth";
export const metadata: Metadata = { title: "NUR NIL TEKSTIL - HR Platform", description: "Human Resources Management Platform" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" /></head>
      <body style={{ margin: 0, background: "#0c0f14", fontFamily: "Outfit, sans-serif" }}><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
F5
echo "Creating app/page.tsx..."
cat > app/page.tsx << 'F6'
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth";
export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading) { if (user) router.push("/dashboard"); else router.push("/login"); } }, [user, loading, router]);
  return (<div style={{ minHeight: "100vh", background: "#0c0f14", display: "flex", alignItems: "center", justifyContent: "center", color: "#8891a4" }}><p>Loading...</p></div>);
}
F6
echo "Creating app/login/page.tsx..."
cat > app/login/page.tsx << 'F7'
"use client";
import { useState } from "react";
import { useAuth } from "../../lib/auth";
import { useRouter } from "next/navigation";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  async function handleLogin() {
    setLoading(true); setError("");
    const err = await signIn(email, password);
    if (err) { setError(err); setLoading(false); } else { router.push("/dashboard"); }
  }
  const inp: React.CSSProperties = { width: "100%", padding: "12px 14px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 10, color: "#e8eaf0", fontSize: 14, fontFamily: "Outfit, sans-serif", outline: "none", boxSizing: "border-box" };
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0c0f14 0%, #0f1520 50%, #111827 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Outfit, sans-serif", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ width: 48, height: 48, margin: "0 auto 16px", background: "linear-gradient(135deg, #3b82f6, #6366f1)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>N</span></div>
          <h1 style={{ color: "#e8eaf0", fontSize: 26, fontWeight: 700, margin: 0 }}>NUR NIL TEKSTIL</h1>
          <p style={{ color: "#5c6478", fontSize: 13, margin: "8px 0 0", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 500 }}>Human Resources Platform</p>
        </div>
        <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 16, padding: "36px 32px" }}>
          <p style={{ color: "#8891a4", fontSize: 14, margin: "0 0 24px", textAlign: "center" }}>Sign in to your account</p>
          {error && (<div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#ef4444", fontSize: 13 }}>{error}</div>)}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#8891a4", fontSize: 12, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} placeholder="admin@nurniltekstil.com" style={inp} />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", color: "#8891a4", fontSize: 12, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} placeholder="Enter password" style={inp} />
          </div>
          <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "13px", background: loading ? "#5c6478" : "linear-gradient(135deg, #3b82f6, #6366f1)", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 600, fontFamily: "Outfit, sans-serif", cursor: loading ? "wait" : "pointer" }}>{loading ? "Signing in..." : "Sign In"}</button>
          <div style={{ marginTop: 28, padding: 16, background: "#1a1f2a", borderRadius: 10, border: "1px solid #252b38" }}>
            <p style={{ color: "#5c6478", fontSize: 11, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Demo Accounts</p>
            <p style={{ color: "#8891a4", fontSize: 12, margin: "0 0 4px" }}>admin@nurniltekstil.com</p>
            <p style={{ color: "#8891a4", fontSize: 12, margin: "0 0 4px" }}>hr.manager@nurniltekstil.com</p>
            <p style={{ color: "#8891a4", fontSize: 12, margin: "0 0 4px" }}>hr.employee@nurniltekstil.com</p>
            <p style={{ color: "#8891a4", fontSize: 12, margin: 0 }}>section.mgr@nurniltekstil.com</p>
            <p style={{ color: "#5c6478", fontSize: 11, margin: "8px 0 0" }}>Password for all: Test123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
F7
echo "Creating app/dashboard/page.tsx..."
cat > app/dashboard/page.tsx << 'F8'
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import Sidebar from "../../components/Sidebar";
export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);
  useEffect(() => { if (user) loadData(); }, [user]);
  async function loadData() {
    let query = supabase.from("employees").select("*, sections(name)").eq("is_approved", true);
    if (user?.role === "section_manager" && user.section_id) { query = query.eq("section_id", user.section_id); }
    const { data } = await query;
    if (data) {
      setEmployees(data);
      const m: Record<string, any> = {};
      data.forEach((e: any) => { const sn = e.sections?.name || "Unknown"; if (!m[sn]) m[sn] = { name: sn, total: 0, clockedIn: 0, onLeave: 0, absent: 0 }; m[sn].total++; if (e.is_clocked_in) m[sn].clockedIn++; if (e.status === "on_leave") m[sn].onLeave++; if (e.status === "absent") m[sn].absent++; });
      setStats(Object.values(m));
    }
  }
  if (loading || !user) return null;
  const tot = employees.length; const ci = employees.filter((e) => e.is_clocked_in).length; const ol = employees.filter((e) => e.status === "on_leave").length; const ab = employees.filter((e) => e.status === "absent").length;
  const cards = [{ label: "Total Employees", value: tot, color: "#3b82f6" }, { label: "Clocked In", value: ci, color: "#22c55e" }, { label: "On Leave", value: ol, color: "#f59e0b" }, { label: "Absent", value: ab, color: "#ef4444" }];
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0f14", color: "#e8eaf0", fontFamily: "Outfit, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 240 }}>
        <header style={{ padding: "18px 32px", borderBottom: "1px solid #252b38", background: "#13171e", position: "sticky", top: 0, zIndex: 50 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Dashboard</h1>
          <p style={{ margin: "2px 0 0", color: "#5c6478", fontSize: 12 }}>{new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </header>
        <div style={{ padding: "28px 32px" }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
            {cards.map((s) => (<div key={s.label} style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: "22px 20px", flex: 1, minWidth: 180 }}><span style={{ color: "#5c6478", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</span><div style={{ fontSize: 30, fontWeight: 700, marginTop: 8 }}>{s.value}</div></div>))}
          </div>
          <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: "20px 22px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Section Headcounts</h3>
            {stats.map((s) => { const pct = s.total > 0 ? (s.clockedIn / s.total) * 100 : 0; return (<div key={s.name} style={{ marginBottom: 16 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</span><span style={{ fontSize: 12, color: "#8891a4" }}>{s.clockedIn} / {s.total}</span></div><div style={{ height: 8, background: "#1a1f2a", borderRadius: 4, overflow: "hidden" }}><div style={{ width: pct + "%", height: "100%", background: pct > 80 ? "#22c55e" : pct > 50 ? "#f59e0b" : "#ef4444", borderRadius: 4 }} /></div></div>); })}
          </div>
        </div>
      </main>
    </div>
  );
}
F8
echo "Creating placeholder pages..."
for p in employees attendance leave approvals disciplinary documents payroll sections settings; do
cat > "app/${p}/page.tsx" << ENDPAGE
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import Sidebar from "../../components/Sidebar";
export default function PlaceholderPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);
  if (loading || !user) return null;
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0f14", color: "#e8eaf0", fontFamily: "Outfit, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 240 }}>
        <header style={{ padding: "18px 32px", borderBottom: "1px solid #252b38", background: "#13171e" }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>${p}</h1>
        </header>
        <div style={{ padding: "28px 32px" }}>
          <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: "60px 20px", textAlign: "center" }}>
            <h3 style={{ margin: "0 0 6px", fontWeight: 600 }}>Coming Soon</h3>
            <p style={{ color: "#5c6478", fontSize: 13, margin: 0 }}>This page is being built.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
ENDPAGE
done
echo ""
echo "===== ALL FILES CREATED ====="
echo "Now run: npm run dev"
