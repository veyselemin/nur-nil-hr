"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import Sidebar from "../../components/Sidebar";

export default function ApprovalsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState<any[]>([]);
  const [allHistory, setAllHistory] = useState<any[]>([]);
  const [view, setView] = useState<"pending" | "history">("pending");
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectCategory, setRejectCategory] = useState("");
  const [detailModal, setDetailModal] = useState<any>(null);

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);
  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, role");
    const getName = (id: string) => { const p = (profiles || []).find((pr: any) => pr.id === id); return p ? p.full_name : "System"; };

    const { data: leaves } = await supabase.from("leave_requests").select("*, employees(full_name, section_id, sections(name))").order("created_at", { ascending: false });
    const pl: any[] = [];
    const hl: any[] = [];
    (leaves || []).forEach((l: any) => {
      const item = { id: l.id, type: "leave_request", title: l.employees?.full_name + " - " + l.leave_type + " leave", description: l.total_days + " days (" + l.start_date + " to " + l.end_date + ")", section: l.employees?.sections?.name, reason: l.reason || "", date: l.created_at, status: l.status, reviewedBy: l.reviewed_by ? getName(l.reviewed_by) : "", reviewedAt: l.reviewed_at || "", reviewNotes: l.review_notes || "", requestedBy: l.requested_by ? getName(l.requested_by) : "Employee", employeeName: l.employees?.full_name || "" };
      if (l.status === "pending") pl.push(item);
      else hl.push(item);
    });

    const { data: emps } = await supabase.from("employees").select("*, sections(name)").eq("is_approved", false);
    (emps || []).forEach((e: any) => {
      pl.push({ id: e.id, type: "new_employee", title: e.full_name + " - New Employee", description: e.position + " | " + e.sections?.name + " | TRY " + new Intl.NumberFormat("tr-TR").format(e.gross_salary), section: e.sections?.name, date: e.created_at, status: "pending", requestedBy: e.created_by ? getName(e.created_by) : "Unknown", employeeName: e.full_name });
    });

    const { data: approvedEmps } = await supabase.from("employees").select("*, sections(name)").eq("is_approved", true).not("approved_by", "is", null);
    (approvedEmps || []).forEach((e: any) => {
      hl.push({ id: e.id, type: "new_employee", title: e.full_name + " - New Employee", description: e.position + " | " + e.sections?.name, section: e.sections?.name, date: e.created_at, status: "approved", reviewedBy: e.approved_by ? getName(e.approved_by) : "", reviewedAt: e.approved_at || "", reviewNotes: "Approved", requestedBy: e.created_by ? getName(e.created_by) : "Unknown", employeeName: e.full_name });
    });

    const { data: disc } = await supabase.from("disciplinary_records").select("*, employees(full_name, sections(name))").order("created_at", { ascending: false });
    (disc || []).forEach((d: any) => {
      hl.push({ id: d.id, type: "disciplinary", title: d.employees?.full_name + " - " + d.type.replace(/_/g, " "), description: d.reason, section: d.employees?.sections?.name, date: d.created_at, status: d.is_resolved ? "resolved" : "active", reviewedBy: d.reported_by ? getName(d.reported_by) : "", reviewedAt: d.date, reviewNotes: d.description || "", requestedBy: d.reported_by ? getName(d.reported_by) : "", employeeName: d.employees?.full_name || "", witnesses: d.witness_names || "" });
    });

    hl.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setPending(pl);
    setAllHistory(hl);
  }

  async function handleApprove(item: any) {
    if (item.type === "leave_request") {
      await supabase.from("leave_requests").update({ status: "approved", reviewed_by: user?.id, reviewed_at: new Date().toISOString(), review_notes: "Approved by " + user?.full_name }).eq("id", item.id);
    } else {
      await supabase.from("employees").update({ is_approved: true, approved_by: user?.id, approved_at: new Date().toISOString() }).eq("id", item.id);
    }
    loadData();
  }

  function openRejectModal(item: any) {
    setRejectModal(item);
    setRejectReason("");
    setRejectCategory("");
  }

  async function handleReject() {
    if (!rejectCategory) return;
    const fullReason = rejectCategory + (rejectReason ? ": " + rejectReason : "");
    if (rejectModal.type === "leave_request") {
      await supabase.from("leave_requests").update({ status: "rejected", reviewed_by: user?.id, reviewed_at: new Date().toISOString(), review_notes: fullReason }).eq("id", rejectModal.id);
    } else {
      await supabase.from("employees").update({ status: "terminated", is_approved: false }).eq("id", rejectModal.id);
    }
    setRejectModal(null);
    setRejectReason("");
    setRejectCategory("");
    loadData();
  }

  if (loading || !user) return null;

  const isApprover = ["admin", "hr_manager"].includes(user.role);
  const isSectionMgr = user.role === "section_manager";
  const visibleHistory = allHistory.filter((h) => {
    if (isApprover) return true;
    if (isSectionMgr && user.section_id) return h.section === allHistory.find((x: any) => x.section)?.section;
    return h.requestedBy === user.full_name || h.employeeName === user.full_name;
  });

  const statusColor: Record<string, string> = { approved: "#22c55e", rejected: "#ef4444", cancelled: "#8891a4", active: "#f59e0b", resolved: "#22c55e", pending: "#f59e0b" };
  const typeColor: Record<string, string> = { new_employee: "#8b5cf6", leave_request: "#f59e0b", disciplinary: "#ef4444" };
  const typeLabel: Record<string, string> = { new_employee: "New Employee", leave_request: "Leave Request", disciplinary: "Disciplinary" };
  const leaveReasons = ["Insufficient leave balance", "Busy period - coverage needed", "Too many employees on leave", "Request conflicts with schedule", "Submitted too late", "Other"];
  const empReasons = ["Incomplete documentation", "Position already filled", "Budget constraints", "Failed background check", "Qualifications not met", "Other"];
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0f14", color: "#e8eaf0", fontFamily: "Outfit, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 240 }}>
        <header style={{ padding: "18px 32px", borderBottom: "1px solid #252b38", background: "#13171e", position: "sticky", top: 0, zIndex: 50 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Approvals & History</h1>
          <p style={{ margin: "2px 0 0", color: "#5c6478", fontSize: 12 }}>{isApprover ? pending.length + " pending | " + visibleHistory.length + " history records" : "Your request history"}</p>
        </header>
        <div style={{ padding: "28px 32px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {isApprover && <button onClick={() => setView("pending")} style={{ padding: "10px 20px", background: view === "pending" ? "rgba(59,130,246,0.12)" : "#13171e", border: view === "pending" ? "1px solid rgba(59,130,246,0.2)" : "1px solid #252b38", borderRadius: 9, color: view === "pending" ? "#3b82f6" : "#8891a4", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>Pending ({pending.length})</button>}
            <button onClick={() => setView("history")} style={{ padding: "10px 20px", background: view === "history" ? "rgba(59,130,246,0.12)" : "#13171e", border: view === "history" ? "1px solid rgba(59,130,246,0.2)" : "1px solid #252b38", borderRadius: 9, color: view === "history" ? "#3b82f6" : "#8891a4", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>History ({visibleHistory.length})</button>
          </div>

          {view === "pending" && isApprover && (
            <div>
              {pending.length === 0 ? (
                <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: "60px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: 24, margin: "0 0 8px" }}>All caught up!</p>
                  <p style={{ color: "#5c6478", fontSize: 13, margin: 0 }}>No pending approvals.</p>
                </div>
              ) : pending.map((item) => (
                <div key={item.type + item.id} style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: "20px 22px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, color: typeColor[item.type], background: typeColor[item.type] + "18" }}>{typeLabel[item.type]}</span>
                      {item.section && <span style={{ fontSize: 11, color: "#5c6478" }}>{item.section}</span>}
                      <span style={{ fontSize: 11, color: "#5c6478" }}>{formatDate(item.date)}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "#8891a4", marginTop: 2 }}>{item.description}</div>
                    {item.reason && <div style={{ fontSize: 12, color: "#5c6478", marginTop: 2 }}>Reason: {item.reason}</div>}
                    <div style={{ fontSize: 11, color: "#5c6478", marginTop: 4 }}>Requested by: {item.requestedBy}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleApprove(item)} style={{ padding: "9px 20px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, color: "#22c55e", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>Approve</button>
                    <button onClick={() => openRejectModal(item)} style={{ padding: "9px 20px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === "history" && (
            <div>
              {visibleHistory.length === 0 ? (
                <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: "60px 20px", textAlign: "center" }}>
                  <p style={{ color: "#5c6478", fontSize: 13 }}>No history records yet.</p>
                </div>
              ) : visibleHistory.map((item, idx) => (
                <div key={item.type + item.id + idx} onClick={() => setDetailModal(item)} style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: "16px 22px", marginBottom: 8, cursor: "pointer", transition: "border-color 0.15s" }} onMouseEnter={(e) => e.currentTarget.style.borderColor = "#3b82f6"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "#252b38"}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, color: typeColor[item.type] || "#8891a4", background: (typeColor[item.type] || "#8891a4") + "18" }}>{typeLabel[item.type] || item.type}</span>
                        <span style={{ fontSize: 11, color: "#5c6478" }}>{formatDate(item.date)}</span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "#5c6478", marginTop: 2 }}>{item.description}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, color: statusColor[item.status] || "#8891a4", background: (statusColor[item.status] || "#8891a4") + "18" }}>{item.status}</span>
                      <span style={{ color: "#5c6478", fontSize: 16 }}>›</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {detailModal && (
        <div onClick={() => setDetailModal(null)} style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 18, width: "100%", maxWidth: 520, padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>Record Details</h2>
              <button onClick={() => setDetailModal(null)} style={{ background: "none", border: "none", color: "#8891a4", fontSize: 20, cursor: "pointer" }}>X</button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, color: typeColor[detailModal.type] || "#8891a4", background: (typeColor[detailModal.type] || "#8891a4") + "18" }}>{typeLabel[detailModal.type] || detailModal.type}</span>
              <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, color: statusColor[detailModal.status] || "#8891a4", background: (statusColor[detailModal.status] || "#8891a4") + "18" }}>{detailModal.status}</span>
            </div>
            <div style={{ background: "#1a1f2a", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{detailModal.title}</div>
              <div style={{ fontSize: 13, color: "#8891a4" }}>{detailModal.description}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
              <div><div style={{ color: "#5c6478", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Employee</div><div style={{ fontSize: 13, fontWeight: 500 }}>{detailModal.employeeName || "-"}</div></div>
              <div><div style={{ color: "#5c6478", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Section</div><div style={{ fontSize: 13, fontWeight: 500 }}>{detailModal.section || "-"}</div></div>
              <div><div style={{ color: "#5c6478", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Requested By</div><div style={{ fontSize: 13, fontWeight: 500 }}>{detailModal.requestedBy || "-"}</div></div>
              <div><div style={{ color: "#5c6478", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Request Date</div><div style={{ fontSize: 13, fontWeight: 500 }}>{formatDate(detailModal.date)}</div></div>
              <div><div style={{ color: "#5c6478", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Reviewed By</div><div style={{ fontSize: 13, fontWeight: 500 }}>{detailModal.reviewedBy || "Pending"}</div></div>
              <div><div style={{ color: "#5c6478", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Review Date</div><div style={{ fontSize: 13, fontWeight: 500 }}>{detailModal.reviewedAt ? formatDate(detailModal.reviewedAt) : "Pending"}</div></div>
            </div>
            {detailModal.reviewNotes && detailModal.status === "rejected" && (
              <div style={{ marginTop: 16, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ color: "#ef4444", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Rejection Reason</div>
                <div style={{ fontSize: 13, color: "#e8eaf0" }}>{detailModal.reviewNotes}</div>
              </div>
            )}
            {detailModal.reviewNotes && detailModal.status === "approved" && (
              <div style={{ marginTop: 16, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ color: "#22c55e", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Approval Note</div>
                <div style={{ fontSize: 13, color: "#e8eaf0" }}>{detailModal.reviewNotes}</div>
              </div>
            )}
            {detailModal.witnesses && (
              <div style={{ marginTop: 12 }}>
                <div style={{ color: "#5c6478", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Witnesses</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{detailModal.witnesses}</div>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setDetailModal(null)} style={{ padding: "10px 22px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 9, color: "#8891a4", fontSize: 13, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {rejectModal && (
        <div onClick={() => setRejectModal(null)} style={{ position: "fixed", inset: 0, zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 18, width: "100%", maxWidth: 480, padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>Rejection Reason</h2>
              <button onClick={() => setRejectModal(null)} style={{ background: "none", border: "none", color: "#8891a4", fontSize: 20, cursor: "pointer" }}>X</button>
            </div>
            <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{rejectModal.title}</div>
              <div style={{ fontSize: 12, color: "#8891a4", marginTop: 2 }}>{rejectModal.description}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: "#5c6478", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Reason Category <span style={{ color: "#ef4444" }}>*</span></label>
              {(rejectModal.type === "leave_request" ? leaveReasons : empReasons).map((reason: string) => (
                <label key={reason} onClick={() => setRejectCategory(reason)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: rejectCategory === reason ? "rgba(239,68,68,0.08)" : "transparent", border: rejectCategory === reason ? "1px solid rgba(239,68,68,0.2)" : "1px solid transparent", borderRadius: 8, marginBottom: 4, cursor: "pointer", fontSize: 13, color: rejectCategory === reason ? "#ef4444" : "#8891a4" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: rejectCategory === reason ? "2px solid #ef4444" : "2px solid #252b38", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {rejectCategory === reason && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />}
                  </div>
                  {reason}
                </label>
              ))}
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", color: "#5c6478", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Additional Details</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Optional - add more context..." rows={3} style={{ width: "100%", padding: "11px 14px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 9, color: "#e8eaf0", fontSize: 13, fontFamily: "Outfit, sans-serif", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setRejectModal(null)} style={{ padding: "11px 22px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 9, color: "#8891a4", fontSize: 13, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>Cancel</button>
              <button onClick={handleReject} disabled={!rejectCategory} style={{ padding: "11px 24px", background: !rejectCategory ? "#252b38" : "linear-gradient(135deg, #ef4444, #dc2626)", border: "none", borderRadius: 9, color: !rejectCategory ? "#5c6478" : "#fff", fontSize: 13, fontWeight: 600, cursor: !rejectCategory ? "not-allowed" : "pointer", fontFamily: "Outfit, sans-serif" }}>Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
