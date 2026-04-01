"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [profiles, setProfiles] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // New User State
  const [newUser, setNewUser] = useState({ full_name: "", email: "", password: "", role: "hr_employee", section_id: "" });
  const [isAdding, setIsAdding] = useState(false);

  // Permissions Modal State
  const [editingProfile, setEditingProfile] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role !== "admin") router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === "admin") fetchData();
  }, [user]);

  const fetchData = async () => {
    setIsLoadingData(true);
    const [profRes, secRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("sections").select("*").eq("is_active", true)
    ]);
    if (profRes.data) setProfiles(profRes.data);
    if (secRes.data) setSections(secRes.data);
    setIsLoadingData(false);
  };

  const handleCreateUser = async () => {
    if (!newUser.full_name || !newUser.email || !newUser.password) return alert("Fill all required fields!");
    setIsAdding(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert("System User created successfully!");
      setNewUser({ full_name: "", email: "", password: "", role: "hr_employee", section_id: "" });
      fetchData();
    } catch (err: any) {
      alert(`Error creating user: ${err.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete the account for ${name}?`)) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert("User deleted successfully.");
      fetchData();
    } catch (err: any) {
      alert(`Error deleting user: ${err.message}`);
    }
  };

  const saveAdvancedPermissions = async () => {
    if (!editingProfile) return;
    const { error } = await supabase.from("profiles").update({ 
      role: editingProfile.role, 
      section_id: editingProfile.role === "section_manager" ? editingProfile.section_id : null,
      permissions: editingProfile.permissions
    }).eq("id", editingProfile.id);

    if (error) {
      alert(`Error saving access: ${error.message}`);
    } else {
      alert("Granular permissions updated securely!");
      setEditingProfile(null);
      fetchData();
    }
  };

  const togglePermission = (key: string) => {
    setEditingProfile({
      ...editingProfile,
      permissions: {
        ...editingProfile.permissions,
        [key]: !editingProfile.permissions?.[key]
      }
    });
  };

  if (loading || !user || user.role !== "admin") return null;

  const inp = { width: "100%", padding: "10px 14px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 8, color: "#e8eaf0", outline: "none", fontSize: 13 };
  const thStyle = { padding: "12px 16px", textAlign: "left" as const, color: "#5c6478", fontSize: 12, fontWeight: 600, textTransform: "uppercase" as const, borderBottom: "1px solid #252b38" };
  const tdStyle = { padding: "16px", borderBottom: "1px solid #252b38", fontSize: 14, color: "#e8eaf0" };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0f14", color: "#e8eaf0", fontFamily: "Outfit, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "30px 40px", marginLeft: 240, position: "relative" }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 30 }}>Admin Control Panel</h1>

        {/* Create User Form */}
        <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: 25, marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: "#3b82f6" }}>+ Add New System User</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 15, alignItems: "end" }}>
            <div><label style={{ display: "block", fontSize: 11, color: "#5c6478", marginBottom: 5 }}>Full Name</label><input value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} placeholder="e.g. Ali Kaya" style={inp} /></div>
            <div><label style={{ display: "block", fontSize: 11, color: "#5c6478", marginBottom: 5 }}>Email (Login)</label><input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="ali@nurnil.com" style={inp} /></div>
            <div><label style={{ display: "block", fontSize: 11, color: "#5c6478", marginBottom: 5 }}>Temporary Password</label><input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="******" style={inp} /></div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#5c6478", marginBottom: 5 }}>Base Role</label>
              <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} style={inp}>
                <option value="hr_employee">HR Employee</option><option value="section_manager">Section Manager</option>
                <option value="hr_manager">HR Manager</option><option value="admin">Admin</option>
              </select>
            </div>
            <button onClick={handleCreateUser} disabled={isAdding} style={{ padding: "10px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", height: 38 }}>
              {isAdding ? "Saving..." : "Create"}
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: 20, borderBottom: "1px solid #252b38", background: "#1a1f2a" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Manage Data Access & Permissions</h2>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>User</th>
                <th style={thStyle}>Base Role</th>
                <th style={thStyle}>Data Restriction</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id}>
                  <td style={tdStyle}><div style={{ fontWeight: 600 }}>{p.full_name}</div><div style={{ fontSize: 12, color: "#8891a4" }}>{p.email}</div></td>
                  <td style={tdStyle}><span style={{ padding: "4px 10px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 20, fontSize: 12 }}>{p.role.replace("_", " ")}</span></td>
                  <td style={tdStyle}>
                    {p.role === "section_manager" && p.section_id ? (
                      <span style={{ color: "#f59e0b", fontWeight: 600, fontSize: 13 }}>Restricted: {sections.find(s=>s.id===p.section_id)?.name}</span>
                    ) : <span style={{ color: "#10b981", fontSize: 13 }}>All Data Access</span>}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setEditingProfile({ ...p, permissions: p.permissions || {} })} style={{ padding: "8px 16px", background: "#10b981", color: "#13171e", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        Edit Permissions
                      </button>
                      <button onClick={() => handleDeleteUser(p.id, p.full_name)} disabled={p.email === 'admin@nurniltekstil.com'} style={{ padding: "8px 16px", background: "transparent", color: p.email === 'admin@nurniltekstil.com' ? "#5c6478" : "#ef4444", border: `1px solid ${p.email === 'admin@nurniltekstil.com' ? '#252b38' : '#ef4444'}`, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: p.email === 'admin@nurniltekstil.com' ? "not-allowed" : "pointer" }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PERMISSIONS MODAL */}
        {editingProfile && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: "#13171e", padding: 40, borderRadius: 16, width: 600, border: "1px solid #252b38" }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 5 }}>Access Control: {editingProfile.full_name}</h2>
              <p style={{ color: "#8891a4", fontSize: 13, marginBottom: 25 }}>Toggle exact features this user is allowed to access.</p>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 30 }}>
                <div>
                   <label style={{ display: "block", fontSize: 12, color: "#5c6478", marginBottom: 5 }}>Change Base Role</label>
                   <select value={editingProfile.role} onChange={(e) => setEditingProfile({...editingProfile, role: e.target.value, section_id: e.target.value === 'section_manager' ? editingProfile.section_id : null})} style={inp}>
                     <option value="hr_employee">HR Employee</option><option value="section_manager">Section Manager</option>
                     <option value="hr_manager">HR Manager</option><option value="admin">Admin</option>
                   </select>
                </div>
                <div>
                   <label style={{ display: "block", fontSize: 12, color: "#5c6478", marginBottom: 5 }}>Restrict Data To Section</label>
                   <select value={editingProfile.section_id || ""} onChange={(e) => setEditingProfile({...editingProfile, section_id: e.target.value})} disabled={editingProfile.role !== 'section_manager'} style={{...inp, opacity: editingProfile.role !== 'section_manager' ? 0.3 : 1}}>
                     <option value="">-- No Restriction (Sees All) --</option>
                     {sections.map(s => <option key={s.id} value={s.id}>{s.name} ({s.location})</option>)}
                   </select>
                </div>
              </div>

              <div style={{ background: "#1a1f2a", padding: 20, borderRadius: 12, border: "1px solid #252b38", marginBottom: 30 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 15, color: "#a5b4fc" }}>Granular Feature Toggles</h3>
                
                {[
                  { key: "can_view_salary", label: "View Employee Salaries", desc: "Allows user to see gross salary amounts." },
                  { key: "can_add_employees", label: "Add New Employees", desc: "Allows user to create new employee profiles." },
                  { key: "can_delete_employees", label: "Delete Employees", desc: "Allows user to permanently delete employees." },
                  { key: "can_manage_leaves", label: "Manage Leave/Holiday Rights", desc: "Allows user to approve/deny leave requests." }
                ].map((perm) => (
                  <div key={perm.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #252b38" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{perm.label}</div>
                      <div style={{ fontSize: 11, color: "#5c6478" }}>{perm.desc}</div>
                    </div>
                    <button onClick={() => togglePermission(perm.key)} style={{ width: 44, height: 24, background: editingProfile.permissions?.[perm.key] ? "#10b981" : "#374151", borderRadius: 20, position: "relative", cursor: "pointer", border: "none", transition: "background 0.2s" }}>
                      <div style={{ width: 18, height: 18, background: "#fff", borderRadius: "50%", position: "absolute", top: 3, left: editingProfile.permissions?.[perm.key] ? 22 : 3, transition: "left 0.2s" }} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 15 }}>
                <button onClick={() => setEditingProfile(null)} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid #5c6478", color: "#e8eaf0", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button onClick={saveAdvancedPermissions} style={{ flex: 1, padding: "12px", background: "#3b82f6", border: "none", color: "#fff", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Save Exact Permissions</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
