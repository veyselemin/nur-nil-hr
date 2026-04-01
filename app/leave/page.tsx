"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import Sidebar from "../../components/Sidebar";
import { useI18n } from "../../lib/i18n";
export default function LeavePage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [view, setView] = useState<"balances" | "requests">("balances");
  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);
  useEffect(() => { if (user) { loadEmployees(); loadRequests(); } }, [user]);
  async function loadEmployees() { let q = supabase.from("employees").select("*, sections(name)").eq("is_approved", true).order("full_name"); if (user?.role === "section_manager" && user.section_id) q = q.eq("section_id", user.section_id); const { data } = await q; if (data) setEmployees(data); }
  async function loadRequests() { const { data } = await supabase.from("leave_requests").select("*, employees(full_name, section_id, sections(name))").order("created_at", { ascending: false }); if (data) { if (user?.role === "section_manager" && user.section_id) { setRequests(data.filter((r: any) => r.employees?.section_id === user.section_id)); } else { setRequests(data); } } }
  async function updateRequest(id: number, status: string) { await supabase.from("leave_requests").update({ status, reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq("id", id); loadRequests(); }
  if (loading || !user) return null;
  const canApprove = user.role === "admin" || user.role === "hr_manager" || user.role === "section_manager";
  const statusColor: Record<string, string> = { approved: "#22c55e", pending: "#f59e0b", rejected: "#ef4444", cancelled: "#8891a4" };
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0f14", color: "#e8eaf0", fontFamily: "Outfit, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 240 }}>
        <header style={{ padding: "18px 32px", borderBottom: "1px solid #252b38", background: "#13171e", position: "sticky", top: 0, zIndex: 50 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t("leave.title")}</h1>
        </header>
        <div style={{ padding: "28px 32px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {(["balances", "requests"] as const).map((v) => (<button key={v} onClick={() => setView(v)} style={{ padding: "10px 20px", background: view === v ? "rgba(59,130,246,0.12)" : "#13171e", border: view === v ? "1px solid rgba(59,130,246,0.2)" : "1px solid #252b38", borderRadius: 9, color: view === v ? "#3b82f6" : "#8891a4", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>{v === "balances" ? t("leave.balances") : t("leave.requests")}</button>))}
          </div>
          {view === "balances" && (
            <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ borderBottom: "1px solid #252b38" }}>{[t("emp.employee"), t("emp.section"), t("empd.total"), t("empd.used"), t("empd.remaining"), t("emp.status")].map((h) => (<th key={h} style={{ padding: "14px 16px", textAlign: "left", color: "#5c6478", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>))}</tr></thead>
                <tbody>{employees.map((emp) => { const rem = emp.annual_leave_total - emp.annual_leave_used; return (<tr key={emp.id} style={{ borderBottom: "1px solid #252b38" }}><td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500 }}>{emp.full_name}</td><td style={{ padding: "12px 16px", fontSize: 13, color: "#8891a4" }}>{emp.sections?.name}</td><td style={{ padding: "12px 16px", fontSize: 13, color: "#8891a4" }}>{emp.annual_leave_total}</td><td style={{ padding: "12px 16px", fontSize: 13, color: "#f59e0b" }}>{emp.annual_leave_used}</td><td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: rem > 5 ? "#22c55e" : rem > 0 ? "#f59e0b" : "#ef4444" }}>{rem}</td><td style={{ padding: "12px 16px" }}><span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, color: emp.status === "active" ? "#22c55e" : "#f59e0b", background: (emp.status === "active" ? "#22c55e" : "#f59e0b") + "18" }}>{t("status." + emp.status) || emp.status.replace("_", " ")}</span></td></tr>); })}</tbody>
              </table>
            </div>
          )}
          {view === "requests" && (
            <div>
              {requests.length === 0 ? (<div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: "60px 20px", textAlign: "center" }}><p style={{ color: "#5c6478", fontSize: 13 }}>{t("leave.no_requests")}</p></div>) : requests.map((r) => (
                <div key={r.id} style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: "20px 22px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}><span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, color: statusColor[r.status], background: statusColor[r.status] + "18" }}>{t("status." + r.status) || r.status}</span><span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#3b82f6", background: "rgba(59,130,246,0.12)" }}>{r.leave_type}</span></div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{r.employees?.full_name}</div>
                    <div style={{ fontSize: 12, color: "#8891a4", marginTop: 2 }}>{r.employees?.sections?.name} | {r.start_date} to {r.end_date} ({r.total_days} {t("common.days")})</div>
                    {r.reason && <div style={{ fontSize: 12, color: "#5c6478", marginTop: 4 }}>{r.reason}</div>}
                  </div>
                  {canApprove && r.status === "pending" && (<div style={{ display: "flex", gap: 8 }}><button onClick={() => updateRequest(r.id, "approved")} style={{ padding: "9px 20px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, color: "#22c55e", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>{t("leave.approve")}</button><button onClick={() => updateRequest(r.id, "rejected")} style={{ padding: "9px 20px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>{t("leave.reject")}</button></div>)}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
