"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import Sidebar from "../../components/Sidebar";
import { useI18n } from "../../lib/i18n";
export default function SectionsPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [stats, setStats] = useState<any[]>([]);
  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);
  useEffect(() => { if (user) loadData(); }, [user]);
  async function loadData() { let q = supabase.from("employees").select("*, sections(name)").eq("is_approved", true); if (user?.role === "section_manager" && user.section_id) q = q.eq("section_id", user.section_id); const { data } = await q; if (data) { const m: Record<string, any> = {}; data.forEach((e: any) => { const sn = e.sections?.name || "Unknown"; if (!m[sn]) m[sn] = { name: sn, total: 0, active: 0, clockedIn: 0, onLeave: 0, absent: 0, suspended: 0, totalSalary: 0, totalPerf: 0 }; m[sn].total++; m[sn].totalSalary += e.gross_salary; m[sn].totalPerf += e.performance_score; if (e.status === "active") m[sn].active++; if (e.is_clocked_in) m[sn].clockedIn++; if (e.status === "on_leave") m[sn].onLeave++; if (e.status === "absent") m[sn].absent++; if (e.status === "suspended") m[sn].suspended++; }); setStats(Object.values(m).sort((a, b) => a.name.localeCompare(b.name))); } }
  if (loading || !user) return null;
  const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0f14", color: "#e8eaf0", fontFamily: "Outfit, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 240 }}>
        <header style={{ padding: "18px 32px", borderBottom: "1px solid #252b38", background: "#13171e", position: "sticky", top: 0, zIndex: 50 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t("sec.title")}</h1>
          <p style={{ margin: "2px 0 0", color: "#5c6478", fontSize: 12 }}>{stats.length} {t("sec.departments")}</p>
        </header>
        <div style={{ padding: "28px 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {stats.map((s) => (
              <div key={s.name} style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: "22px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}><h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{s.name}</h3><div style={{ width: 10, height: 10, borderRadius: "50%", background: s.clockedIn > s.total * 0.7 ? "#22c55e" : s.clockedIn > s.total * 0.4 ? "#f59e0b" : "#ef4444" }} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div><div style={{ color: "#5c6478", fontSize: 11 }}>{t("sec.total")}</div><div style={{ fontSize: 20, fontWeight: 700 }}>{s.total}</div></div>
                  <div><div style={{ color: "#5c6478", fontSize: 11 }}>{t("sec.clocked_in")}</div><div style={{ fontSize: 20, fontWeight: 700, color: "#22c55e" }}>{s.clockedIn}</div></div>
                  <div><div style={{ color: "#5c6478", fontSize: 11 }}>{t("att.on_leave")}</div><div style={{ fontSize: 20, fontWeight: 700, color: "#f59e0b" }}>{s.onLeave}</div></div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid #252b38", fontSize: 12 }}><span style={{ color: "#5c6478" }}>{t("sec.avg_perf")}</span><span style={{ fontWeight: 600 }}>{s.total > 0 ? Math.round(s.totalPerf / s.total) : 0}%</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid #252b38", fontSize: 12 }}><span style={{ color: "#5c6478" }}>{t("sec.payroll")}</span><span style={{ fontWeight: 600 }}>TRY {fmt(s.totalSalary)}</span></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
