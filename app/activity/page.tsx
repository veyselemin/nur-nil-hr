"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

// ── colour helpers ────────────────────────────────────────────────────────────
const ACTION_COLORS: Record<string, string> = {
  added_employee: "#22c55e",
  edited_employee: "#3b82f6",
  deleted_employee: "#ef4444",
  uploaded_document: "#22c55e",
  deleted_document: "#ef4444",
  submitted_leave: "#f59e0b",
  approved_leave: "#22c55e",
  rejected_leave: "#ef4444",
  added_disciplinary: "#f97316",
  approved_employee: "#22c55e",
  rejected_employee: "#ef4444",
  clock_in: "#10b981",
  clock_out: "#8891a4",
  created_user: "#a78bfa",
  deleted_user: "#ef4444",
  updated_permissions: "#a78bfa",
};
const ACTION_LABELS: Record<string, string> = {
  added_employee: "New Employee Added",
  edited_employee: "Employee Edited",
  deleted_employee: "Employee Deleted",
  uploaded_document: "Document Uploaded",
  deleted_document: "Document Deleted",
  submitted_leave: "Leave Request",
  approved_leave: "Leave Approved",
  rejected_leave: "Leave Rejected",
  added_disciplinary: "Disciplinary Record",
  approved_employee: "Employee Approved",
  rejected_employee: "Employee Rejected",
  clock_in: "Clocked In",
  clock_out: "Clocked Out",
  created_user: "User Created",
  deleted_user: "User Deleted",
  updated_permissions: "Permissions Updated",
};
const CATEGORY_FILTERS = [
  { label: "All Activity", value: "" },
  { label: "Employees", value: "employee" },
  { label: "Documents", value: "document" },
  { label: "Leave", value: "leave_request" },
  { label: "Disciplinary", value: "disciplinary_record" },
  { label: "Attendance", value: "attendance" },
  { label: "Users", value: "user" },
];
const ROLE_DISPLAY: Record<string, string> = {
  admin: "Admin",
  hr_manager: "HR Manager",
  hr_employee: "HR Employee",
  section_manager: "Section Manager",
};

function timeAgo(iso: string) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fullTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── main component ────────────────────────────────────────────────────────────
export default function ActivityPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<"feed" | "deleted">("feed");
  const [deletedSubTab, setDeletedSubTab] = useState<"documents" | "employees">("documents");

  // Activity Feed state
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("");
  const [allUsers, setAllUsers] = useState<string[]>([]);

  // Deleted Items state
  const [deletedDocs, setDeletedDocs] = useState<any[]>([]);
  const [deletedEmps, setDeletedEmps] = useState<any[]>([]);
  const [deletedLoading, setDeletedLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role !== "admin") router.push("/dashboard");
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchLogs();
      fetchDeleted();
    }
  }, [user]);

  // ── fetch logs ──────────────────────────────────────────────────────────────
  const fetchLogs = async () => {
    setLogsLoading(true);
    const { data } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data) {
      setLogs(data);
      const names = Array.from(new Set(data.map((l: any) => l.user_name))) as string[];
      setAllUsers(names);
    }
    setLogsLoading(false);
  };

  // ── fetch soft-deleted items ────────────────────────────────────────────────
  const fetchDeleted = async () => {
    setDeletedLoading(true);
    const [docsRes, empsRes] = await Promise.all([
      supabase
        .from("documents")
        .select("*, employees(full_name, sections(name))")
        .eq("is_deleted", true)
        .order("deleted_at", { ascending: false }),
      supabase
        .from("employees")
        .select("*, sections(name)")
        .eq("is_deleted", true)
        .order("deleted_at", { ascending: false }),
    ]);
    if (docsRes.data) setDeletedDocs(docsRes.data);
    if (empsRes.data) setDeletedEmps(empsRes.data);
    setDeletedLoading(false);
  };

  // ── restore document ────────────────────────────────────────────────────────
  const restoreDocument = async (docId: number) => {
    if (!confirm("Restore this document? It will become visible to all users again.")) return;
    await supabase.from("documents").update({ is_deleted: false, deleted_at: null, deleted_by_id: null, deleted_by_name: null }).eq("id", docId);
    fetchDeleted();
    fetchLogs();
  };

  // ── restore employee ────────────────────────────────────────────────────────
  const restoreEmployee = async (empId: number) => {
    if (!confirm("Restore this employee? They will reappear in the employee list.")) return;
    await supabase.from("employees").update({ is_deleted: false, deleted_at: null, deleted_by_id: null, deleted_by_name: null, status: "active" }).eq("id", empId);
    fetchDeleted();
    fetchLogs();
  };

  // ── download deleted document ───────────────────────────────────────────────
  const downloadDeletedDoc = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage.from("employee-documents").download(filePath);
    if (error) return alert(`Download failed: ${error.message}`);
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
  };

  // ── filter logs ─────────────────────────────────────────────────────────────
  const filteredLogs = logs.filter(log => {
    if (categoryFilter && log.entity_type !== categoryFilter) return false;
    if (userFilter && log.user_name !== userFilter) return false;
    if (dateFilter !== "all") {
      const now = new Date();
      const logDate = new Date(log.created_at);
      if (dateFilter === "today") {
        if (logDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 86400000);
        if (logDate < weekAgo) return false;
      } else if (dateFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 86400000);
        if (logDate < monthAgo) return false;
      }
    }
    return true;
  });

  // ── stats for today ─────────────────────────────────────────────────────────
  const todayLogs = logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString());
  const todayCount = todayLogs.length;
  const mostActiveUser = (() => {
    if (!todayLogs.length) return "—";
    const counts: Record<string, number> = {};
    todayLogs.forEach(l => { counts[l.user_name] = (counts[l.user_name] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  })();

  if (loading || !user) return null;
  if (user.role !== "admin") return null;

  // ── styles ──────────────────────────────────────────────────────────────────
  const tabBtn = (active: boolean) => ({
    padding: "10px 22px",
    background: active ? "rgba(59,130,246,0.12)" : "#13171e",
    border: active ? "1px solid rgba(59,130,246,0.3)" : "1px solid #252b38",
    borderRadius: 9,
    color: active ? "#3b82f6" : "#8891a4",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "Outfit, sans-serif",
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0f14", color: "#e8eaf0", fontFamily: "Outfit, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 240 }}>

        {/* ── Header ── */}
        <header style={{ padding: "20px 32px", borderBottom: "1px solid #252b38", background: "#13171e", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Activity Monitor</h1>
              <p style={{ margin: "3px 0 0", color: "#5c6478", fontSize: 12 }}>Full audit trail — every action by every user, nothing is ever truly erased</p>
            </div>
            <button onClick={() => { fetchLogs(); fetchDeleted(); }} style={{ padding: "8px 18px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 8, color: "#8891a4", fontSize: 12, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>
              Refresh
            </button>
          </div>
        </header>

        <div style={{ padding: "28px 32px" }}>

          {/* ── Stats bar ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
            {[
              { label: "Total Activity Today", value: todayCount, color: "#3b82f6" },
              { label: "Most Active Today", value: mostActiveUser, color: "#22c55e" },
              { label: "Deleted Documents", value: deletedDocs.length, color: "#ef4444" },
              { label: "Deleted Employees", value: deletedEmps.length, color: "#f59e0b" },
            ].map(stat => (
              <div key={stat.label} style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ color: "#5c6478", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{stat.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* ── Main Tabs ── */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            <button onClick={() => setTab("feed")} style={tabBtn(tab === "feed")}>
              Live Activity Feed {logsLoading ? "" : `(${filteredLogs.length})`}
            </button>
            <button onClick={() => setTab("deleted")} style={tabBtn(tab === "deleted")}>
              Deleted Items Vault {deletedDocs.length + deletedEmps.length > 0 ? `(${deletedDocs.length + deletedEmps.length})` : ""}
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: ACTIVITY FEED */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {tab === "feed" && (
            <div>
              {/* Filters */}
              <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", background: "#13171e", padding: "16px 20px", borderRadius: 14, border: "1px solid #252b38" }}>
                {/* Category filter */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {CATEGORY_FILTERS.map(f => (
                    <button key={f.value} onClick={() => setCategoryFilter(f.value)}
                      style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid", borderColor: categoryFilter === f.value ? "#3b82f6" : "#252b38", background: categoryFilter === f.value ? "rgba(59,130,246,0.12)" : "transparent", color: categoryFilter === f.value ? "#3b82f6" : "#8891a4", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10, marginLeft: "auto", alignItems: "center" }}>
                  {/* Date filter */}
                  <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                    style={{ padding: "7px 12px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 8, color: "#e8eaf0", fontSize: 12, fontFamily: "Outfit, sans-serif" }}>
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                  {/* User filter */}
                  <select value={userFilter} onChange={e => setUserFilter(e.target.value)}
                    style={{ padding: "7px 12px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 8, color: "#e8eaf0", fontSize: 12, fontFamily: "Outfit, sans-serif" }}>
                    <option value="">All Users</option>
                    {allUsers.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Activity list */}
              {logsLoading ? (
                <div style={{ padding: 60, textAlign: "center", color: "#5c6478" }}>Loading activity log...</div>
              ) : filteredLogs.length === 0 ? (
                <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: 60, textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>No activity found</div>
                  <div style={{ color: "#5c6478", fontSize: 13 }}>Actions will appear here as users work in the system.</div>
                </div>
              ) : (
                <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, overflow: "hidden" }}>
                  {filteredLogs.map((log, idx) => {
                    const color = ACTION_COLORS[log.action_type] || "#8891a4";
                    const label = ACTION_LABELS[log.action_type] || log.action_type.replace(/_/g, " ");
                    const roleLabel = ROLE_DISPLAY[log.user_role] || log.user_role;
                    return (
                      <div key={log.id} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "16px 20px", borderBottom: idx < filteredLogs.length - 1 ? "1px solid #1a1f2a" : "none", transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#1a1f2a")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        {/* Dot */}
                        <div style={{ marginTop: 5, flexShrink: 0 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}60` }} />
                        </div>
                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Badge + time */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                            <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, color, background: color + "18", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
                            <span style={{ fontSize: 11, color: "#5c6478" }}>{roleLabel}</span>
                            <span style={{ fontSize: 11, color: "#5c6478", marginLeft: "auto" }} title={fullTime(log.created_at)}>{timeAgo(log.created_at)}</span>
                          </div>
                          {/* Description */}
                          <div style={{ fontSize: 14, color: "#e8eaf0", lineHeight: 1.5 }}>{log.description}</div>
                          {/* Sub-info */}
                          <div style={{ fontSize: 11, color: "#5c6478", marginTop: 2 }}>
                            by <span style={{ color: "#a5b4fc", fontWeight: 600 }}>{log.user_name}</span>
                            {" · "}{fullTime(log.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: DELETED ITEMS VAULT */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {tab === "deleted" && (
            <div>
              <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 10, padding: "12px 18px", marginBottom: 20, fontSize: 13, color: "#fca5a5" }}>
                <strong>Admin-only vault.</strong> Items shown here were deleted by users — but nothing is truly erased. You can restore any item or download documents at any time.
              </div>

              {/* Sub-tabs */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <button onClick={() => setDeletedSubTab("documents")} style={tabBtn(deletedSubTab === "documents")}>
                  Deleted Documents ({deletedDocs.length})
                </button>
                <button onClick={() => setDeletedSubTab("employees")} style={tabBtn(deletedSubTab === "employees")}>
                  Deleted Employees ({deletedEmps.length})
                </button>
              </div>

              {/* ── Deleted Documents ── */}
              {deletedSubTab === "documents" && (
                <div>
                  {deletedLoading ? (
                    <div style={{ padding: 60, textAlign: "center", color: "#5c6478" }}>Loading...</div>
                  ) : deletedDocs.length === 0 ? (
                    <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: 60, textAlign: "center" }}>
                      <div style={{ fontSize: 20, marginBottom: 8 }}>No deleted documents</div>
                      <div style={{ color: "#5c6478", fontSize: 13 }}>Documents that users delete will appear here.</div>
                    </div>
                  ) : (
                    <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, overflow: "hidden" }}>
                      <div style={{ padding: "14px 20px", borderBottom: "1px solid #252b38", background: "#1a1f2a", display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Deleted Documents — only you can see these</span>
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "#1a1f2a" }}>
                            {["Document Name", "Category", "Belongs To", "Deleted By", "Deleted On", "Actions"].map(h => (
                              <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#5c6478", fontSize: 11, fontWeight: 600, textTransform: "uppercase", borderBottom: "1px solid #252b38" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {deletedDocs.map(doc => (
                            <tr key={doc.id} style={{ borderBottom: "1px solid #1a1f2a" }}>
                              <td style={{ padding: "14px 16px" }}>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{doc.document_name}</div>
                              </td>
                              <td style={{ padding: "14px 16px", color: "#3b82f6", fontWeight: 600, fontSize: 13 }}>{doc.document_type}</td>
                              <td style={{ padding: "14px 16px", fontSize: 13 }}>
                                <div style={{ fontWeight: 500 }}>{doc.employees?.full_name || "Unknown"}</div>
                                <div style={{ fontSize: 11, color: "#5c6478" }}>{doc.employees?.sections?.name}</div>
                              </td>
                              <td style={{ padding: "14px 16px", fontSize: 13, color: "#f87171" }}>{doc.deleted_by_name || "Unknown"}</td>
                              <td style={{ padding: "14px 16px", fontSize: 12, color: "#8891a4" }}>
                                {doc.deleted_at ? fullTime(doc.deleted_at) : "—"}
                              </td>
                              <td style={{ padding: "14px 16px" }}>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button onClick={() => restoreDocument(doc.id)}
                                    style={{ padding: "6px 12px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 6, color: "#22c55e", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>
                                    Restore
                                  </button>
                                  <button onClick={() => downloadDeletedDoc(doc.file_path, doc.document_name)}
                                    style={{ padding: "6px 12px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 6, color: "#3b82f6", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>
                                    Download
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── Deleted Employees ── */}
              {deletedSubTab === "employees" && (
                <div>
                  {deletedLoading ? (
                    <div style={{ padding: 60, textAlign: "center", color: "#5c6478" }}>Loading...</div>
                  ) : deletedEmps.length === 0 ? (
                    <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: 60, textAlign: "center" }}>
                      <div style={{ fontSize: 20, marginBottom: 8 }}>No deleted employees</div>
                      <div style={{ color: "#5c6478", fontSize: 13 }}>Employees that users delete will appear here.</div>
                    </div>
                  ) : (
                    <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, overflow: "hidden" }}>
                      <div style={{ padding: "14px 20px", borderBottom: "1px solid #252b38", background: "#1a1f2a", display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Deleted Employees — only you can see these</span>
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "#1a1f2a" }}>
                            {["Employee", "Position", "Section", "Deleted By", "Deleted On", "Actions"].map(h => (
                              <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#5c6478", fontSize: 11, fontWeight: 600, textTransform: "uppercase", borderBottom: "1px solid #252b38" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {deletedEmps.map(emp => (
                            <tr key={emp.id} style={{ borderBottom: "1px solid #1a1f2a" }}>
                              <td style={{ padding: "14px 16px" }}>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{emp.full_name}</div>
                                <div style={{ fontSize: 11, color: "#8891a4" }}>{emp.tc_kimlik_no}</div>
                              </td>
                              <td style={{ padding: "14px 16px", fontSize: 13, color: "#8891a4" }}>{emp.position || "—"}</td>
                              <td style={{ padding: "14px 16px", fontSize: 13 }}>
                                <div>{emp.sections?.name || "—"}</div>
                                <div style={{ fontSize: 11, color: "#5c6478" }}>{emp.location}</div>
                              </td>
                              <td style={{ padding: "14px 16px", fontSize: 13, color: "#f87171" }}>{emp.deleted_by_name || "Unknown"}</td>
                              <td style={{ padding: "14px 16px", fontSize: 12, color: "#8891a4" }}>
                                {emp.deleted_at ? fullTime(emp.deleted_at) : "—"}
                              </td>
                              <td style={{ padding: "14px 16px" }}>
                                <button onClick={() => restoreEmployee(emp.id)}
                                  style={{ padding: "6px 14px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 6, color: "#22c55e", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>
                                  Restore Employee
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
