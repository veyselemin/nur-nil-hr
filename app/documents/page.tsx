"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import Sidebar from "../../components/Sidebar";
import { useI18n } from "../../lib/i18n";
export default function DocumentsPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ employee_id: "", document_name: "", document_type: "contract" });
  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);
  useEffect(() => { if (user) { loadDocs(); loadEmployees(); } }, [user]);
  async function loadDocs() { const { data } = await supabase.from("documents").select("*, employees(full_name, section_id, sections(name))").order("created_at", { ascending: false }); if (data) { if (user?.role === "section_manager" && user.section_id) setDocs(data.filter((d: any) => d.employees?.section_id === user.section_id)); else setDocs(data); } }
  async function loadEmployees() { let q = supabase.from("employees").select("id, full_name").eq("is_approved", true).order("full_name"); if (user?.role === "section_manager" && user.section_id) q = q.eq("section_id", user.section_id); const { data } = await q; if (data) setEmployees(data); }
  async function submitDoc() { if (!uploadForm.employee_id || !uploadForm.document_name) return; await supabase.from("documents").insert({ employee_id: parseInt(uploadForm.employee_id), document_name: uploadForm.document_name, document_type: uploadForm.document_type, file_path: "employee-documents/" + uploadForm.employee_id + "/" + uploadForm.document_name.toLowerCase().replace(/\s+/g, "-") + ".pdf", mime_type: "application/pdf", uploaded_by: user?.id }); setShowUpload(false); setUploadForm({ employee_id: "", document_name: "", document_type: "contract" }); loadDocs(); }
  if (loading || !user) return null;
  const canUpload = user.role === "admin" || user.role === "hr_manager" || user.role === "hr_employee";
  const filtered = docs.filter((d) => !search || d.employees?.full_name?.toLowerCase().includes(search.toLowerCase()) || d.document_name.toLowerCase().includes(search.toLowerCase()));
  const typeIcon: Record<string, string> = { contract: "C", id_copy: "ID", diploma: "D", health_report: "H", other: "?" };
  const inp: React.CSSProperties = { width: "100%", padding: "11px 14px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 9, color: "#e8eaf0", fontSize: 13, fontFamily: "Outfit, sans-serif", outline: "none", boxSizing: "border-box" };
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0f14", color: "#e8eaf0", fontFamily: "Outfit, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 240 }}>
        <header style={{ padding: "18px 32px", borderBottom: "1px solid #252b38", background: "#13171e", position: "sticky", top: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t("docs.title")}</h1><p style={{ margin: "2px 0 0", color: "#5c6478", fontSize: 12 }}>{filtered.length} documents</p></div>
          {canUpload && <button onClick={() => setShowUpload(true)} style={{ padding: "9px 18px", background: "linear-gradient(135deg, #3b82f6, #6366f1)", border: "none", borderRadius: 9, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>{t("docs.upload")}</button>}
        </header>
        <div style={{ padding: "28px 32px" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("docs.search")} style={{ ...inp, marginBottom: 20, maxWidth: 400 }} />
          <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: "1px solid #252b38" }}>{[t("docs.name"), t("emp.employee"), t("emp.section"), t("docs.type"), t("docs.uploaded")].map((h) => (<th key={h} style={{ padding: "14px 16px", textAlign: "left", color: "#5c6478", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>))}</tr></thead>
              <tbody>{filtered.map((d) => (<tr key={d.id} style={{ borderBottom: "1px solid #252b38" }}><td style={{ padding: "12px 16px" }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#3b82f6" }}>{typeIcon[d.document_type] || "?"}</div><div style={{ fontSize: 13, fontWeight: 500 }}>{d.document_name}</div></div></td><td style={{ padding: "12px 16px", fontSize: 13, color: "#8891a4" }}>{d.employees?.full_name}</td><td style={{ padding: "12px 16px", fontSize: 13, color: "#8891a4" }}>{d.employees?.sections?.name}</td><td style={{ padding: "12px 16px" }}><span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#3b82f6", background: "rgba(59,130,246,0.12)" }}>{d.document_type.replace("_", " ")}</span></td><td style={{ padding: "12px 16px", fontSize: 12, color: "#5c6478" }}>{new Date(d.created_at).toLocaleDateString("en-GB")}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      </main>
      {showUpload && (
        <div onClick={() => setShowUpload(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 18, width: "100%", maxWidth: 480, padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}><h2 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>{t("docs.upload_title")}</h2><button onClick={() => setShowUpload(false)} style={{ background: "none", border: "none", color: "#8891a4", fontSize: 20, cursor: "pointer" }}>X</button></div>
            <div style={{ marginBottom: 16 }}><label style={{ display: "block", color: "#5c6478", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{t("emp.employee")} *</label><select value={uploadForm.employee_id} onChange={(e) => setUploadForm({ ...uploadForm, employee_id: e.target.value })} style={{ ...inp, cursor: "pointer" }}><option value="">{t("common.select")}</option>{employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}</select></div>
            <div style={{ marginBottom: 16 }}><label style={{ display: "block", color: "#5c6478", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{t("docs.name")} *</label><input value={uploadForm.document_name} onChange={(e) => setUploadForm({ ...uploadForm, document_name: e.target.value })} style={inp} /></div>
            <div style={{ marginBottom: 16 }}><label style={{ display: "block", color: "#5c6478", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{t("docs.type")}</label><select value={uploadForm.document_type} onChange={(e) => setUploadForm({ ...uploadForm, document_type: e.target.value })} style={{ ...inp, cursor: "pointer" }}><option value="contract">{t("docs.contract")}</option><option value="id_copy">{t("docs.id_copy")}</option><option value="diploma">{t("docs.diploma")}</option><option value="health_report">{t("docs.health")}</option><option value="other">{t("docs.other")}</option></select></div>
            <div style={{ marginBottom: 24 }}><label style={{ display: "block", color: "#5c6478", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>File</label><div style={{ border: "2px dashed #252b38", borderRadius: 10, padding: "20px 16px", textAlign: "center", cursor: "pointer" }}><p style={{ color: "#8891a4", fontSize: 13, margin: 0 }}>{t("docs.drag")}</p><p style={{ color: "#5c6478", fontSize: 11, margin: "4px 0 0" }}>PDF, DOCX, JPG up to 10MB</p></div></div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}><button onClick={() => setShowUpload(false)} style={{ padding: "11px 22px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 9, color: "#8891a4", fontSize: 13, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>{t("common.cancel")}</button><button onClick={submitDoc} style={{ padding: "11px 24px", background: "linear-gradient(135deg, #3b82f6, #6366f1)", border: "none", borderRadius: 9, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>Upload</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
