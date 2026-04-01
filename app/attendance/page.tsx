"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import Sidebar from "../../components/Sidebar";
import { useI18n } from "../../lib/i18n";
export default function AttendancePage() {
  const { user, loading } = useAuth();
  const { t, lang } = useI18n();
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);
  useEffect(() => { if (user) loadData(); }, [user]);
  async function loadData() {
    let q = supabase.from("employees").select("*, sections(name)").eq("is_approved", true).order("full_name");
    if (user?.role === "section_manager" && user.section_id) q = q.eq("section_id", user.section_id);
    const { data } = await q;
    if (data) { setEmployees(data); const m: Record<string, any> = {}; data.forEach((e: any) => { const sn = e.sections?.name || "Unknown"; if (!m[sn]) m[sn] = { name: sn, total: 0, clockedIn: 0, onLeave: 0, absent: 0 }; m[sn].total++; if (e.is_clocked_in) m[sn].clockedIn++; if (e.status === "on_leave") m[sn].onLeave++; if (e.status === "absent") m[sn].absent++; }); setSections(Object.values(m)); }
  }
  async function toggleClock(emp: any) { const newVal = !emp.is_clocked_in; await supabase.from("employees").update({ is_clocked_in: newVal }).eq("id", emp.id); loadData(); }
  if (loading || !user) return null;
  const ci = employees.filter((e) => e.is_clocked_in).length;
  const nci = employees.filter((e) => !e.is_clocked_in && e.status === "active").length;
  const ol = employees.filter((e) => e.status === "on_leave").length;
  const shown = filter === "all" ? employees : filter === "in" ? employees.filter((e) => e.is_clocked_in) : filter === "out" ? employees.filter((e) => !e.is_clocked_in && e.status === "active") : employees.filter((e) => e.status === "on_leave");
  const canEdit = user.role === "admin" || user.role === "hr_manager" || user.role === "section_manager";
  const dateLocale = lang === "ar" ? "ar-EG" : lang === "tr" ? "tr-TR" : "en-GB";
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0f14", color: "#e8eaf0", fontFamily: "Outfit, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 240 }}>
        <header style={{ padding: "18px 32px", borderBottom: "1px solid #252b38", background: "#13171e", position: "sticky", top: 0, zIndex: 50 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t("att.title")}</h1>
          <p style={{ margin: "2px 0 0", color: "#5c6478", fontSize: 12 }}>{t("att.live")} - {new Date().toLocaleDateString(dateLocale, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </header>
        <div style={{ padding: "28px 32px" }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
            {[{ label: t("att.clocked_in"), value: ci, color: "#22c55e", f: "in" }, { label: t("att.not_clocked"), value: nci, color: "#ef4444", f: "out" }, { label: t("att.on_leave"), value: ol, color: "#f59e0b", f: "leave" }].map((s) => (
              <div key={s.label} onClick={() => setFilter(filter === s.f ? "all" : s.f)} style={{ background: "#13171e", border: filter === s.f ? "1px solid " + s.color : "1px solid #252b38", borderRadius: 14, padding: "22px 20px", flex: 1, minWidth: 180, cursor: "pointer" }}>
                <span style={{ color: "#5c6478", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</span>
                <div style={{ fontSize: 30, fontWeight: 700, marginTop: 8, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: "20px 22px", marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>{t("dash.section_headcounts")}</h3>
            {sections.map((s: any) => { const pct = s.total > 0 ? (s.clockedIn / s.total) * 100 : 0; return (<div key={s.name} style={{ marginBottom: 16 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</span><div style={{ display: "flex", gap: 16 }}><span style={{ fontSize: 12, color: "#22c55e" }}>{s.clockedIn} in</span><span style={{ fontSize: 12, color: "#f59e0b" }}>{s.onLeave} leave</span><span style={{ fontSize: 12, color: "#ef4444" }}>{s.absent} absent</span><span style={{ fontSize: 12, color: "#8891a4" }}>{s.total} total</span></div></div><div style={{ height: 8, background: "#1a1f2a", borderRadius: 4, overflow: "hidden" }}><div style={{ width: pct + "%", height: "100%", background: pct > 80 ? "#22c55e" : pct > 50 ? "#f59e0b" : "#ef4444", borderRadius: 4 }} /></div></div>); })}
          </div>
          <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #252b38", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{t("att.employee_list")} ({shown.length})</h3>
              {filter !== "all" && <button onClick={() => setFilter("all")} style={{ padding: "6px 14px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 7, color: "#8891a4", fontSize: 12, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>{t("att.show_all")}</button>}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: "1px solid #252b38" }}>{[t("emp.employee"), t("emp.section"), t("emp.status"), t("att.clock_status"), ...(canEdit ? [t("att.action")] : [])].map((h) => (<th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#5c6478", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>))}</tr></thead>
              <tbody>
                {shown.map((emp) => (
                  <tr key={emp.id} style={{ borderBottom: "1px solid #252b38" }}>
                    <td style={{ padding: "12px 16px" }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: emp.is_clocked_in ? "#22c55e" : emp.status === "on_leave" ? "#f59e0b" : "#ef4444" }} /><div style={{ fontSize: 13, fontWeight: 500 }}>{emp.full_name}</div></div></td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#8891a4" }}>{emp.sections?.name}</td>
                    <td style={{ padding: "12px 16px" }}><span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, color: emp.status === "active" ? "#22c55e" : emp.status === "on_leave" ? "#f59e0b" : "#ef4444", background: (emp.status === "active" ? "#22c55e" : emp.status === "on_leave" ? "#f59e0b" : "#ef4444") + "18" }}>{t("status." + emp.status) || emp.status.replace("_", " ")}</span></td>
                    <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 13, fontWeight: 600, color: emp.is_clocked_in ? "#22c55e" : "#ef4444" }}>{emp.is_clocked_in ? t("att.clocked_in") : t("att.not_clocked")}</span></td>
                    {canEdit && (<td style={{ padding: "12px 16px" }}>{emp.status === "active" && (<button onClick={() => toggleClock(emp)} style={{ padding: "6px 14px", background: emp.is_clocked_in ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)", border: emp.is_clocked_in ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(34,197,94,0.2)", borderRadius: 7, color: emp.is_clocked_in ? "#ef4444" : "#22c55e", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>{emp.is_clocked_in ? t("att.clock_out") : t("att.clock_in")}</button>)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
