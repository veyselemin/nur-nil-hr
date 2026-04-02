"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import Sidebar from "../../components/Sidebar";
import { useI18n } from "../../lib/i18n";
import { logActivity } from "../../lib/logActivity";
export default function DisciplinaryPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [form, setForm] = useState({ employee_id: "", type: "verbal_warning", reason: "", description: "", witness_names: "" });
  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);
  useEffect(() => { if (user) { loadRecords(); loadEmployees(); } }, [user]);
  async function loadRecords() { const { data } = await supabase.from("disciplinary_records").select("*, employees(full_name, section_id, sections(name))").order("date", { ascending: false }); if (data) { if (user?.role === "section_manager" && user.section_id) setRecords(data.filter((r: any) => r.employees?.section_id === user.section_id)); else setRecords(data); } }
  async function loadEmployees() { let q = supabase.from("employees").select("id, full_name, section_id").eq("is_approved", true).order("full_name"); if (user?.role === "section_manager" && user.section_id) q = q.eq("section_id", user.section_id); const { data } = await q; if (data) setEmployees(data); }
  async function submitRecord() {
    if (!form.employee_id || !form.reason) return;
    const { data: newRecord } = await supabase.from("disciplinary_records").insert({
      employee_id: parseInt(form.employee_id), type: form.type, reason: form.reason,
      description: form.description, witness_names: form.witness_names,
      reported_by: user?.id, date: new Date().toISOString().split("T")[0]
    }).select().single();
    const empName = employees.find(e => String(e.id) === String(form.employee_id))?.full_name || "Unknown Employee";
    const typeLabel = form.type.replace(/_/g, " ");
    await logActivity({
      userId: user!.id,
      userName: user!.full_name,
      userRole: user!.role,
      actionType: "added_disciplinary",
      entityType: "disciplinary_record",
      entityId: newRecord?.id,
      entityName: empName,
      description: `${user!.full_name} issued a ${typeLabel} to ${empName} — Reason: ${form.reason}`,
      metadata: { type: form.type, reason: form.reason, employee_id: form.employee_id },
    });
    setShowAdd(false);
    setForm({ employee_id: "", type: "verbal_warning", reason: "", description: "", witness_names: "" });
    loadRecords();
  }
  if (loading || !user) return null;
  const canAdd = user.role === "admin" || user.role === "hr_manager" || user.role === "section_manager";
  const typeColor: Record<string, string> = { verbal_warning: "#f59e0b", written_warning: "#ef4444", final_warning: "#ef4444", suspension: "#8b5cf6", termination: "#ef4444" };
  const inp: React.CSSProperties = { width: "100%", padding: "11px 14px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 9, color: "#e8eaf0", fontSize: 13, fontFamily: "Outfit, sans-serif", outline: "none", boxSizing: "border-box" };
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0f14", color: "#e8eaf0", fontFamily: "Outfit, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 240 }}>
        <header style={{ padding: "18px 32px", borderBottom: "1px solid #252b38", background: "#13171e", position: "sticky", top: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t("disc.title")}</h1><p style={{ margin: "2px 0 0", color: "#5c6478", fontSize: 12 }}>{records.length} records total</p></div>
          {canAdd && <button onClick={() => setShowAdd(true)} style={{ padding: "9px 18px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 9, color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>{t("disc.new")}</button>}
        </header>
        <div style={{ padding: "28px 32px" }}>
          {records.length === 0 ? (<div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: "60px 20px", textAlign: "center" }}><p style={{ color: "#5c6478", fontSize: 13 }}>{t("disc.no_records")}</p></div>) : records.map((r) => (
            <div key={r.id} style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: "20px 22px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 15, fontWeight: 600 }}>{r.employees?.full_name}</span><span style={{ fontSize: 12, color: "#5c6478" }}>{r.employees?.sections?.name}</span></div><span style={{ fontSize: 11, color: "#5c6478" }}>{r.date}</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, color: typeColor[r.type] || "#ef4444", background: (typeColor[r.type] || "#ef4444") + "18" }}>{t("disc." + r.type.replace("_warning","").replace("verbal","verbal").replace("written","written").replace("final","final").replace("suspension","suspension").replace("termination","termination")) || r.type.replace(/_/g, " ")}</span>{r.is_resolved && <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#22c55e", background: "rgba(34,197,94,0.12)" }}>{t("status.resolved")}</span>}</div>
              <p style={{ color: "#e8eaf0", fontSize: 13, margin: "0 0 4px" }}>{r.reason}</p>
              {r.description && <p style={{ color: "#8891a4", fontSize: 12, margin: "0 0 4px" }}>{r.description}</p>}
              {r.witness_names && <p style={{ color: "#5c6478", fontSize: 11, margin: 0 }}>{t("disc.witnesses")}: {r.witness_names}</p>}
            </div>
          ))}
        </div>
      </main>
      {showAdd && (
        <div onClick={() => setShowAdd(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 18, width: "100%", maxWidth: 520, padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}><h2 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>{t("disc.log")}</h2><button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", color: "#8891a4", fontSize: 20, cursor: "pointer" }}>X</button></div>
            <div style={{ marginBottom: 16 }}><label style={{ display: "block", color: "#5c6478", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{t("disc.employee")} *</label><select value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} style={{ ...inp, cursor: "pointer" }}><option value="">{t("common.select")}</option>{employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}</select></div>
            <div style={{ marginBottom: 16 }}><label style={{ display: "block", color: "#5c6478", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{t("disc.type")} *</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ ...inp, cursor: "pointer" }}><option value="verbal_warning">{t("disc.verbal")}</option><option value="written_warning">{t("disc.written")}</option><option value="final_warning">{t("disc.final")}</option><option value="suspension">{t("disc.suspension")}</option><option value="termination">{t("disc.termination")}</option></select></div>
            <div style={{ marginBottom: 16 }}><label style={{ display: "block", color: "#5c6478", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{t("disc.reason")} *</label><input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Sleeping during shift" style={inp} /></div>
            <div style={{ marginBottom: 16 }}><label style={{ display: "block", color: "#5c6478", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{t("disc.details")}</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inp, resize: "vertical" as const }} /></div>
            <div style={{ marginBottom: 24 }}><label style={{ display: "block", color: "#5c6478", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{t("disc.witnesses")}</label><input value={form.witness_names} onChange={(e) => setForm({ ...form, witness_names: e.target.value })} style={inp} /></div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}><button onClick={() => setShowAdd(false)} style={{ padding: "11px 22px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 9, color: "#8891a4", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>{t("common.cancel")}</button><button onClick={submitRecord} style={{ padding: "11px 24px", background: "linear-gradient(135deg, #ef4444, #dc2626)", border: "none", borderRadius: 9, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>{t("disc.submit")}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
