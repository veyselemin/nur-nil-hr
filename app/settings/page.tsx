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

  // New User Form State
  const [newUser, setNewUser] = useState({ full_name: "", email: "", password: "", role: "hr_employee", section_id: "" });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    // Kick out non-admins
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

  const handleUpdateAccess = async (profileId: string, currentRole: string, currentSection: string | null) => {
    const { error } = await supabase.from("profiles").update({ 
      role: currentRole, 
      section_id: currentRole === "section_manager" ? currentSection : null 
    }).eq("id", profileId);

    if (error) alert(`Error saving access: ${error.message}`);
    else alert("Access permissions updated successfully!");
  };

  if (loading || !user || user.role !== "admin") return null;

  const inp = { width: "100%", padding: "10px 14px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 8, color: "#e8eaf0", outline: "none", fontSize: 13 };
  const thStyle = { padding: "12px 16px", textAlign: "left" as const, color: "#5c6478", fontSize: 12, fontWeight: 600, textTransform: "uppercase" as const, borderBottom: "1px solid #252b38" };
  const tdStyle = { padding: "16px", borderBottom: "1px solid #252b38", fontSize: 14, color: "#e8eaf0" };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0f14", color: "#e8eaf0", fontFamily: "Outfit, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "30px 40px", marginLeft: 240 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 30 }}>Admin Control Panel</h1>

        {/* ADD NEW USER WIDGET */}
        <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: 25, marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: "#3b82f6" }}>+ Add New System User</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr auto", gap: 15, alignItems: "end" }}>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#5c6478", marginBottom: 5 }}>Full Name</label>
              <input value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} placeholder="e.g. Ali Kaya" style={inp} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#5c6478", marginBottom: 5 }}>Email (Login)</label>
              <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="ali@nurnil.com" style={inp} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#5c6478", marginBottom: 5 }}>Temporary Password</label>
              <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="******" style={inp} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#5c6478", marginBottom: 5 }}>Role</label>
              <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value, section_id: ""})} style={inp}>
                <option value="hr_employee">HR Employee</option>
                <option value="section_manager">Section Manager</option>
                <option value="hr_manager">HR Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#5c6478", marginBottom: 5 }}>Restrict Data To (Optional)</label>
              <select value={newUser.section_id} onChange={e => setNewUser({...newUser, section_id: e.target.value})} disabled={newUser.role !== 'section_manager'} style={{...inp, opacity: newUser.role !== 'section_manager' ? 0.3 : 1}}>
                <option value="">-- Select Section --</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name} ({s.location})</option>)}
              </select>
            </div>
            <button onClick={handleCreateUser} disabled={isAdding} style={{ padding: "10px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", height: 38 }}>
              {isAdding ? "Saving..." : "Create"}
            </button>
          </div>
        </div>

        {/* MANAGE EXISTING USERS */}
        <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: 20, borderBottom: "1px solid #252b38", background: "#1a1f2a" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Manage Data Access & Users</h2>
          </div>
          
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>User</th>
                <th style={thStyle}>System Role</th>
                <th style={thStyle}>Data Restriction (Section)</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p, index) => (
                <tr key={p.id}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600 }}>{p.full_name}</div>
                    <div style={{ fontSize: 12, color: "#8891a4" }}>{p.email}</div>
                  </td>
                  
                  <td style={tdStyle}>
                    <select 
                      value={p.role} 
                      onChange={(e) => {
                        const newProfiles = [...profiles];
                        newProfiles[index].role = e.target.value;
                        if (e.target.value !== 'section_manager') newProfiles[index].section_id = null;
                        setProfiles(newProfiles);
                      }} 
                      style={inp}
                    >
                      <option value="hr_employee">HR Employee</option>
                      <option value="section_manager">Section Manager</option>
                      <option value="hr_manager">HR Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>

                  <td style={tdStyle}>
                    <select 
                      value={p.section_id || ""} 
                      onChange={(e) => {
                        const newProfiles = [...profiles];
                        newProfiles[index].section_id = e.target.value;
                        setProfiles(newProfiles);
                      }} 
                      disabled={p.role !== 'section_manager'}
                      style={{ ...inp, opacity: p.role !== 'section_manager' ? 0.3 : 1 }}
                    >
                      <option value="">All Data Access</option>
                      {sections.map(s => <option key={s.id} value={s.id}>{s.name} ({s.location})</option>)}
                    </select>
                  </td>

                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button 
                        onClick={() => handleUpdateAccess(p.id, p.role, p.section_id)}
                        style={{ padding: "8px 16px", background: "#10b981", color: "#13171e", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        Save Access
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(p.id, p.full_name)}
                        disabled={p.email === 'admin@nurniltekstil.com'}
                        style={{ padding: "8px 16px", background: "transparent", color: p.email === 'admin@nurniltekstil.com' ? "#5c6478" : "#ef4444", border: `1px solid ${p.email === 'admin@nurniltekstil.com' ? '#252b38' : '#ef4444'}`, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: p.email === 'admin@nurniltekstil.com' ? "not-allowed" : "pointer" }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}
