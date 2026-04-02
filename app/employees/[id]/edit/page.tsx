"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import { logActivity } from "@/lib/logActivity";

const documentCategories = ["Passport / National ID", "Birth Certificate", "Employment Contract", "Driving License", "Education Certificate", "Training Document", "Insurance Copy", "Medical Report", "Other"];

export default function EditEmployeePage() {
  const params = useParams();
  const id = params?.id;
  const { user, loading } = useAuth();
  const router = useRouter();

  const [sections, setSections] = useState<any[]>([]);
  const [form, setForm] = useState<any>(null);
  const [existingDocs, setExistingDocs] = useState<any[]>([]);

  // New Documents to add
  const [newDocuments, setNewDocuments] = useState<any[]>([{ type: "", otherSpec: "", file: null }]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    supabase.from("sections").select("*").then(({ data }) => setSections(data || []));

    if (id) {
      supabase.from("employees").select("*").eq("id", id).single().then(({ data }) => { if (data) setForm(data); });
      fetchDocuments();
    }
  }, [id, user, loading, router]);

  const fetchDocuments = async () => {
    // Only show non-deleted documents
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("employee_id", id)
      .or("is_deleted.eq.false,is_deleted.is.null")
      .order("created_at", { ascending: false });
    if (data) setExistingDocs(data);
  };

  const updateNewDoc = (index: number, field: string, value: any) => {
    const newDocs = [...newDocuments];
    newDocs[index][field] = value;
    setNewDocuments(newDocs);
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage.from("employee-documents").download(filePath);
    if (error) return alert(`Download failed: ${error.message}`);
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteDoc = async (docId: string, filePath: string, docName: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    // SOFT DELETE — never erase from database or storage
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("documents")
      .update({
        is_deleted: true,
        deleted_at: now,
        deleted_by_id: user?.id,
        deleted_by_name: user?.full_name,
      })
      .eq("id", docId);

    if (error) {
      alert(error.message);
    } else {
      // Log the action
      await logActivity({
        userId: user!.id,
        userName: user!.full_name,
        userRole: user!.role,
        actionType: "deleted_document",
        entityType: "document",
        entityId: docId,
        entityName: docName,
        description: `${user!.full_name} deleted document "${docName}" from employee profile (ID: ${id})`,
        metadata: { file_path: filePath, employee_id: id },
      });
      fetchDocuments();
    }
  };

  const handleSubmit = async () => {
    const sanitizedForm = { ...form };
    Object.keys(sanitizedForm).forEach(key => { if (sanitizedForm[key] === "") sanitizedForm[key] = null; });

    // Remove auto-generated and read-only columns — Postgres won't allow updating these
    const { id: _id, full_name, created_at, updated_at, is_clocked_in, last_clock_in, last_clock_out, ...updateData } = sanitizedForm;

    // 1. Update Employee
    const { error } = await supabase.from("employees").update(updateData).eq("id", id);
    if (error) return alert(`Error updating: ${error.message}`);

    // 2. Log the edit
    await logActivity({
      userId: user!.id,
      userName: user!.full_name,
      userRole: user!.role,
      actionType: "edited_employee",
      entityType: "employee",
      entityId: String(id),
      entityName: form.full_name || `${form.first_name} ${form.last_name}`,
      description: `${user!.full_name} edited employee profile: ${form.full_name || form.first_name + " " + form.last_name}`,
    });

    // 3. Upload New Documents
    const validDocs = newDocuments.filter(d => d.file && d.type);
    if (validDocs.length > 0) {
      for (const doc of validDocs) {
        const finalType = doc.type === "Other" ? doc.otherSpec || "Other" : doc.type;
        const filePath = `${id}/${Date.now()}_${doc.file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
        const { error: uploadErr } = await supabase.storage.from('employee-documents').upload(filePath, doc.file);
        if (!uploadErr) {
          await supabase.from('documents').insert([{ employee_id: id, document_name: doc.file.name, document_type: finalType, file_path: filePath, mime_type: doc.file.type, uploaded_by: user?.id }]);
          // Log document upload
          await logActivity({
            userId: user!.id,
            userName: user!.full_name,
            userRole: user!.role,
            actionType: "uploaded_document",
            entityType: "document",
            entityName: doc.file.name,
            description: `${user!.full_name} uploaded document "${doc.file.name}" (${finalType}) for employee ${form.full_name || form.first_name + " " + form.last_name}`,
            metadata: { employee_id: id, document_type: finalType },
          });
        }
      }
    }
    alert("Employee & Documents updated successfully!");
    router.push(`/employees`);
  };

  if (!form) return <div style={{background: "#0c0f14", minHeight:"100vh", padding: 50}}>Loading...</div>;
  const inp = { width: "100%", padding: "11px 14px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 9, color: "#e8eaf0", outline: "none", boxSizing: "border-box" as const };
  const lbl = { display: "block", color: "#5c6478", fontSize: 11, fontWeight: 500, textTransform: "uppercase" as const, marginBottom: 5 };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0f14", color: "#e8eaf0", fontFamily: "Outfit, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "30px 40px", marginLeft: 240 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 30 }}>Edit: {form.first_name} {form.last_name}</h1>

        <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: 30, maxWidth: 900 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div><label style={lbl}>First Name</label><input value={form.first_name || ""} onChange={(e)=>setForm({...form, first_name: e.target.value})} style={inp} /></div>
            <div><label style={lbl}>Last Name</label><input value={form.last_name || ""} onChange={(e)=>setForm({...form, last_name: e.target.value})} style={inp} /></div>
            <div><label style={lbl}>TC Kimlik / ID</label><input value={form.tc_kimlik_no || ""} onChange={(e)=>setForm({...form, tc_kimlik_no: e.target.value})} style={inp} /></div>
            <div><label style={lbl}>Gross Salary (Monthly)</label><input type="number" value={form.gross_salary || ""} onChange={(e)=>setForm({...form, gross_salary: e.target.value})} style={inp} /></div>
          </div>

          <hr style={{ borderTop: "1px solid #252b38", margin: "30px 0" }}/>

          {/* MANAGING EXISTING DOCUMENTS */}
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#e8eaf0", marginBottom: 15 }}>Existing Documents</h2>
          {existingDocs.length === 0 ? (
            <div style={{ padding: 20, background: "#1a1f2a", borderRadius: 8, color: "#8891a4", fontSize: 13, marginBottom: 20 }}>No documents uploaded yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 10, marginBottom: 30 }}>
              {existingDocs.map(doc => (
                <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{doc.document_name}</div>
                    <div style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>{doc.document_type}</div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => handleDownload(doc.file_path, doc.document_name)} style={{ padding: "6px 12px", background: "#10b981", color: "#13171e", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Download</button>
                    <button onClick={() => handleDeleteDoc(doc.id, doc.file_path, doc.document_name)} style={{ padding: "6px 12px", background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <hr style={{ borderTop: "1px dashed #252b38", margin: "30px 0" }}/>

          {/* UPLOAD NEW DOCUMENTS */}
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#e8eaf0", marginBottom: 15 }}>Add New Documents</h2>
          {newDocuments.map((doc, idx) => (
             <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: 15, marginBottom: 15, padding: 15, background: "#1a1f2a", borderRadius: 8, border: "1px dashed #3b82f6" }}>
                <div>
                  <select value={doc.type} onChange={(e) => updateNewDoc(idx, "type", e.target.value)} style={inp}>
                    <option value="">-- Select Category --</option>
                    {documentCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {doc.type === "Other" && <input placeholder="Specify type..." value={doc.otherSpec} onChange={(e) => updateNewDoc(idx, "otherSpec", e.target.value)} style={{...inp, marginTop: 10}} />}
                </div>
                <div><input type="file" onChange={(e) => updateNewDoc(idx, "file", e.target.files?.[0] || null)} style={{ color: "#e8eaf0", width: "100%", padding: "8px 0" }} /></div>
             </div>
          ))}
          <button onClick={() => setNewDocuments([...newDocuments, { type: "", otherSpec: "", file: null }])} style={{ color: "#3b82f6", background: "transparent", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>+ Add Another Document</button>

          <button onClick={handleSubmit} style={{ marginTop: 40, width: "100%", padding: "14px", background: "#10b981", color: "#13171e", border: "none", borderRadius: 9, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Save Employee & Upload Files</button>
        </div>
      </main>
    </div>
  );
}
