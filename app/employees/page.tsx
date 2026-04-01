"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import { useTranslation } from "@/lib/i18n";

export default function EmployeesPage() {
  const { user, loading } = useAuth();
  const { t, lang, dir } = useTranslation();
  const router = useRouter();
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Selection
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [empRes, secRes] = await Promise.all([
      supabase.from("employee_summary").select("*").order("created_at", { ascending: false }),
      supabase.from("sections").select("*").eq("is_active", true)
    ]);
    if (empRes.data) {
      setEmployees(empRes.data);
      setFilteredEmployees(empRes.data);
    }
    if (secRes.data) setSections(secRes.data);
    setIsLoading(false);
  };

  // Apply Filters
  useEffect(() => {
    let result = employees;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e => 
        e.full_name?.toLowerCase().includes(q) || 
        e.tc_kimlik_no?.includes(q) || 
        e.phone?.includes(q)
      );
    }
    if (locationFilter) result = result.filter(e => e.location === locationFilter);
    if (sectionFilter) result = result.filter(e => e.section_name === sectionFilter);
    if (statusFilter) result = result.filter(e => e.status === statusFilter);
    
    setFilteredEmployees(result);
  }, [search, locationFilter, sectionFilter, statusFilter, employees]);

  // Bulk Selection Logic
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredEmployees.length) setSelectedIds([]);
    else setSelectedIds(filteredEmployees.map(e => e.id));
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  // Excel/CSV Export
  const exportToExcel = () => {
    if (filteredEmployees.length === 0) return alert("No data to export.");
    const headers = ["ID", "Full Name", "TC Kimlik / ID", "Phone", "Location", "Section", "Position", "Status", "Gross Salary", "Start Date"];
    
    const dataToExport = selectedIds.length > 0 
      ? filteredEmployees.filter(e => selectedIds.includes(e.id)) 
      : filteredEmployees;

    const csvRows = [headers.join(",")];
    
    dataToExport.forEach(e => {
      const row = [
        e.id, 
        `"${e.full_name || ""}"`, 
        `"${e.tc_kimlik_no || ""}"`, 
        `"${e.phone || ""}"`, 
        `"${e.location || ""}"`, 
        `"${e.section_name || ""}"`, 
        `"${e.position || ""}"`, 
        e.status, 
        e.gross_salary || 0, 
        e.start_date || ""
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `employees_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} employees?`)) return;
    
    const { error } = await supabase.from("employees").delete().in("id", selectedIds);
    if (error) {
      alert(`Delete error: ${error.message}`);
    } else {
      setSelectedIds([]);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) alert(`Error: ${error.message}`);
    else fetchData();
  };

  if (loading || !user) return null;

  const inpStyle = { padding: "10px 14px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 8, color: "#e8eaf0", outline: "none", fontSize: 13 };
  const thStyle = { padding: "12px 16px", textAlign: "left" as const, color: "#5c6478", fontSize: 12, fontWeight: 600, textTransform: "uppercase" as const, borderBottom: "1px solid #252b38" };
  const tdStyle = { padding: "16px", borderBottom: "1px solid #252b38", fontSize: 14, color: "#e8eaf0" };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0f14", color: "#e8eaf0", fontFamily: "Outfit, sans-serif", direction: dir }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "30px 40px", marginLeft: dir === 'ltr' ? 240 : 0, marginRight: dir === 'rtl' ? 240 : 0 }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>{t("nav.employees") || "Employees"}</h1>
          <div style={{ display: "flex", gap: 10 }}>
            {selectedIds.length > 0 && (
              <button onClick={handleBulkDelete} style={{ padding: "10px 20px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
                Delete Selected ({selectedIds.length})
              </button>
            )}
            <button onClick={exportToExcel} style={{ padding: "10px 20px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
              Export Excel/CSV
            </button>
            <button onClick={() => router.push("/employees/add")} style={{ padding: "10px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
              + Add Employee
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div style={{ display: "flex", gap: 15, marginBottom: 20, flexWrap: "wrap", background: "#13171e", padding: 20, borderRadius: 14, border: "1px solid #252b38" }}>
          <input 
            placeholder="Search name, ID, or phone..." 
            value={search} onChange={(e) => setSearch(e.target.value)} 
            style={{ ...inpStyle, flex: 1, minWidth: 200 }} 
          />
          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={inpStyle}>
            <option value="">All Locations</option>
            <option value="Beni Suef">Beni Suef</option>
            <option value="Sadat City">Sadat City</option>
          </select>
          <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} style={inpStyle}>
            <option value="">All Sections</option>
            {sections.filter(s => !locationFilter || s.location === locationFilter).map(s => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inpStyle}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="absent">Absent</option>
            <option value="suspended">Suspended</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
        
        {/* TABLE */}
        <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, overflow: "hidden" }}>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#8891a4" }}>Loading employees...</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr style={{ background: "#1a1f2a" }}>
                    <th style={{...thStyle, width: 40}}>
                      <input 
                        type="checkbox" 
                        checked={filteredEmployees.length > 0 && selectedIds.length === filteredEmployees.length}
                        onChange={toggleSelectAll} 
                      />
                    </th>
                    <th style={thStyle}>Name & Contact</th>
                    <th style={thStyle}>National ID</th>
                    <th style={thStyle}>Location & Section</th>
                    <th style={thStyle}>Position</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(emp => (
                    <tr key={emp.id} style={{ transition: "background 0.2s", background: selectedIds.includes(emp.id) ? "rgba(59, 130, 246, 0.05)" : "transparent" }}>
                      
                      <td style={tdStyle}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(emp.id)} 
                          onChange={() => toggleSelect(emp.id)} 
                        />
                      </td>

                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: "#fff" }}>{emp.full_name}</div>
                        <div style={{ fontSize: 12, color: "#8891a4", marginTop: 4 }}>{emp.phone || "No phone"}</div>
                      </td>
                      
                      <td style={tdStyle}>
                        <span style={{ fontFamily: "monospace", color: "#a5b4fc" }}>{emp.tc_kimlik_no}</span>
                      </td>
                      
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500 }}>{emp.location || "N/A"}</div>
                        <div style={{ fontSize: 12, color: "#8891a4", marginTop: 4 }}>{emp.section_name || "N/A"}</div>
                      </td>
                      
                      <td style={tdStyle}>{emp.position || "N/A"}</td>
                      
                      <td style={tdStyle}>
                        <span style={{ 
                          padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                          background: emp.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: emp.status === 'active' ? '#10b981' : '#ef4444'
                        }}>
                          {emp.status}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 10 }}>
                          
                          {/* 🔥 THE FIXED EDIT BUTTON: Directly routes to full edit page */}
                          <button 
                            onClick={() => router.push(`/employees/${emp.id}/edit`)} 
                            style={{ padding: "8px 16px", background: "#10b981", color: "#13171e", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                          >
                            Edit
                          </button>
                          
                          <button 
                            onClick={() => handleDelete(emp.id)} 
                            style={{ padding: "8px 16px", background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                          >
                            Delete
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#8891a4" }}>No employees found matching filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
