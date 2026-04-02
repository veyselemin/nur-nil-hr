"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import { logActivity } from "@/lib/logActivity";

export default function EmployeesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (user) loadFullProfileAndData();
  }, [user, loading, router]);

  const loadFullProfileAndData = async () => {
    setIsLoading(true);
    
    // 1. Fetch exact permissions for the logged-in user
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id).single();
    setUserProfile(profile);

    // 2. Fetch Employees (ENFORCING SECTION LOCK IF APPLICABLE)
    let empQuery = supabase.from("employee_summary").select("*").order("created_at", { ascending: false });
    
    if (profile?.role === "section_manager" && profile?.section_id) {
       // 🔥 THIS IS THE FIX: Section Managers are physically blocked from fetching other sections
       empQuery = empQuery.eq("section_id", profile.section_id);
    }

    const [empRes, secRes] = await Promise.all([
      empQuery,
      supabase.from("sections").select("*").eq("is_active", true)
    ]);

    if (empRes.data) {
      setEmployees(empRes.data);
      setFilteredEmployees(empRes.data);
    }
    if (secRes.data) setSections(secRes.data);
    setIsLoading(false);
  };

  useEffect(() => {
    let result = employees;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e => e.full_name?.toLowerCase().includes(q) || e.tc_kimlik_no?.includes(q));
    }
    if (locationFilter) result = result.filter(e => e.location === locationFilter);
    if (sectionFilter) result = result.filter(e => e.section_name === sectionFilter);
    setFilteredEmployees(result);
  }, [search, locationFilter, sectionFilter, employees]);

  const handleDelete = async (empId: string, empName: string) => {
    if (!userProfile?.permissions?.can_delete_employees) return alert("Access Denied: You do not have permission to delete employees.");
    if (!confirm(`Are you sure you want to delete ${empName}? An admin can always restore them later.`)) return;

    // SOFT DELETE — the employee is hidden from normal view but never truly removed
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("employees")
      .update({
        is_deleted: true,
        deleted_at: now,
        deleted_by_id: userProfile.id,
        deleted_by_name: userProfile.full_name,
        status: "terminated",
      })
      .eq("id", empId);

    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      await logActivity({
        userId: userProfile.id,
        userName: userProfile.full_name,
        userRole: userProfile.role,
        actionType: "deleted_employee",
        entityType: "employee",
        entityId: empId,
        entityName: empName,
        description: `${userProfile.full_name} deleted employee: ${empName} (record moved to admin vault, restorable)`,
      });
      loadFullProfileAndData();
    }
  };

  if (loading || !userProfile) return <div style={{background: "#0c0f14", height: "100vh"}}></div>;

  const canViewSalary = userProfile.permissions?.can_view_salary;
  const canAdd = userProfile.permissions?.can_add_employees;
  const canDelete = userProfile.permissions?.can_delete_employees;

  const thStyle = { padding: "12px 16px", textAlign: "left" as const, color: "#5c6478", fontSize: 12, fontWeight: 600, textTransform: "uppercase" as const, borderBottom: "1px solid #252b38" };
  const tdStyle = { padding: "16px", borderBottom: "1px solid #252b38", fontSize: 14, color: "#e8eaf0" };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0f14", color: "#e8eaf0", fontFamily: "Outfit, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "30px 40px", marginLeft: 240 }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>Employees List</h1>
          
          {/* ENFORCING ADD LOCK */}
          {canAdd && (
            <button onClick={() => router.push("/employees/add")} style={{ padding: "10px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
              + Add Employee
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 15, marginBottom: 20, background: "#13171e", padding: 20, borderRadius: 14, border: "1px solid #252b38" }}>
          <input placeholder="Search name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: "10px 14px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 8, color: "#e8eaf0", outline: "none", flex: 1 }} />
          
          {/* Hide location/section filters if the user is locked to a specific section */}
          {!(userProfile.role === "section_manager" && userProfile.section_id) && (
            <>
              <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={{ padding: "10px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 8, color: "#e8eaf0" }}>
                <option value="">All Locations</option><option value="Beni Suef">Beni Suef</option><option value="Sadat City">Sadat City</option>
              </select>
              <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} style={{ padding: "10px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 8, color: "#e8eaf0" }}>
                <option value="">All Sections</option>
                {sections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </>
          )}
        </div>
        
        <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr style={{ background: "#1a1f2a" }}>
                  <th style={thStyle}>Name & Contact</th>
                  <th style={thStyle}>Section & Job</th>
                  {canViewSalary && <th style={thStyle}>Gross Salary</th>}
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} style={{ transition: "background 0.2s" }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{emp.full_name}</div>
                      <div style={{ fontSize: 12, color: "#8891a4" }}>{emp.tc_kimlik_no}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500 }}>{emp.section_name || "N/A"}</div>
                      <div style={{ fontSize: 12, color: "#8891a4" }}>{emp.position || "N/A"}</div>
                    </td>
                    
                    {/* ENFORCING SALARY LOCK */}
                    {canViewSalary && (
                      <td style={tdStyle}><span style={{ fontFamily: "monospace", color: "#10b981", fontWeight: 600 }}>₺{emp.gross_salary || 0}</span></td>
                    )}

                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={() => router.push(`/employees/${emp.id}/edit`)} style={{ padding: "6px 12px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                        
                        {/* ENFORCING DELETE LOCK */}
                        {canDelete && (
                           <button onClick={() => handleDelete(emp.id, emp.full_name)} style={{ padding: "6px 12px", background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Delete</button>
                        )}
                      </div>
                    </td>
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
