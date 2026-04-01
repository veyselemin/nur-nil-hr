"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

export default function DocumentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [documents, setDocuments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (user) fetchDocuments();
  }, [user, loading, router]);

  const fetchDocuments = async () => {
    // Join with employees to get the full name
    const { data } = await supabase.from("documents").select(`*, employees(full_name, location)`).order("created_at", { ascending: false });
    if (data) setDocuments(data);
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage.from("employee-documents").download(filePath);
    if (error) {
      console.error("Download error:", error);
      return alert(`Download failed: ${error.message}\n\nMake sure Supabase storage policies are set correctly.`);
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (docId: number, filePath: string) => {
    if (!confirm("Are you sure you want to permanently delete this document?")) return;
    const { error: storageErr } = await supabase.storage.from("employee-documents").remove([filePath]);
    if (storageErr) console.warn("Storage delete warning:", storageErr.message);
    const { error: dbErr } = await supabase.from("documents").delete().eq("id", docId);
    if (dbErr) {
      console.error("DB delete error:", dbErr);
      return alert(`Delete failed: ${dbErr.message}`);
    }
    fetchDocuments();
  };

  const filteredDocs = documents.filter(d => {
    const matchSearch = d.document_name.toLowerCase().includes(search.toLowerCase()) || d.employees?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter ? d.document_type === typeFilter : true;
    return matchSearch && matchType;
  });

  const uniqueTypes = Array.from(new Set(documents.map(d => d.document_type)));

  if (loading || !user) return null;
  const thStyle = { padding: "12px 16px", textAlign: "left" as const, color: "#5c6478", fontSize: 12, fontWeight: 600, textTransform: "uppercase" as const, borderBottom: "1px solid #252b38" };
  const tdStyle = { padding: "16px", borderBottom: "1px solid #252b38", fontSize: 14, color: "#e8eaf0" };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0f14", color: "#e8eaf0", fontFamily: "Outfit, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "30px 40px", marginLeft: 240 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 30 }}>Company Document Hub</h1>
        
        <div style={{ display: "flex", gap: 15, marginBottom: 20, background: "#13171e", padding: 20, borderRadius: 14, border: "1px solid #252b38" }}>
          <input placeholder="Search file name or employee name..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: "10px 14px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 8, color: "#e8eaf0", outline: "none", flex: 1 }} />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: "10px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 8, color: "#e8eaf0" }}>
            <option value="">All Document Types</option>
            {uniqueTypes.map(t => <option key={t as string} value={t as string}>{t as React.ReactNode}</option>)}
          </select>
        </div>

        <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#1a1f2a" }}>
                <th style={thStyle}>Document Name</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Belongs To (Employee)</th>
                <th style={thStyle}>Date Uploaded</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map(doc => (
                <tr key={doc.id} style={{ transition: "background 0.2s" }}>
                  <td style={{...tdStyle, fontWeight: 600}}>{doc.document_name}</td>
                  <td style={{...tdStyle, color: "#3b82f6", fontWeight: 600}}>{doc.document_type}</td>
                  <td style={tdStyle}>{doc.employees?.full_name || "Unknown"} <span style={{fontSize: 11, color:"#8891a4", display:"block"}}>{doc.employees?.location}</span></td>
                  <td style={tdStyle}>{new Date(doc.created_at).toLocaleDateString()}</td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => handleDownload(doc.file_path, doc.document_name)} style={{ padding: "6px 12px", background: "#10b981", color: "#13171e", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Download</button>
                      <button onClick={() => handleDelete(doc.id, doc.file_path)} style={{ padding: "6px 12px", background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDocs.length === 0 && <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#8891a4" }}>No documents found.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
