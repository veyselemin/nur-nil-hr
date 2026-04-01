"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

const documentCategories = [
  "Passport / National ID", "Birth Certificate", "Employment Contract", 
  "Driving License", "Education Certificate", "Training Document", 
  "Insurance Copy", "Medical Report", "Other"
];

export default function AddEmployeePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [sections, setSections] = useState<any[]>([]);
  const [dbPositions, setDbPositions] = useState<string[]>([]);
  const [isCustomPosition, setIsCustomPosition] = useState(false);
  const [customPosition, setCustomPosition] = useState("");

  const [documents, setDocuments] = useState<any[]>([{ type: "", otherSpec: "", file: null }]);

  // EVERY SINGLE FIELD RESTORED
  const [form, setForm] = useState({
    first_name: "", last_name: "", tc_kimlik_no: "", phone: "", email: "", emergency_contact: "",
    location: "", section_id: "", position: "", gross_salary: "",
    date_of_birth: "", start_date: new Date().toISOString().split('T')[0], gender: "", marital_status: "", blood_type: "", address: ""
  });

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);
  
  useEffect(() => {
    supabase.from("sections").select("*").eq("is_active", true).then(({ data }) => setSections(data || []));
  }, []);

  useEffect(() => {
    if (form.section_id) {
      supabase.from("employees").select("position").eq("section_id", form.section_id)
        .then(({ data }) => {
          if (data) setDbPositions(Array.from(new Set(data.map(d => d.position).filter(Boolean))) as string[]);
        });
    } else setDbPositions([]);
  }, [form.section_id]);

  const addDocRow = () => setDocuments([...documents, { type: "", otherSpec: "", file: null }]);
  const removeDocRow = (index: number) => setDocuments(documents.filter((_, i) => i !== index));
  const updateDoc = (index: number, field: string, value: any) => {
    const newDocs = [...documents];
    newDocs[index][field] = value;
    setDocuments(newDocs);
  };

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  const handleSubmit = async () => {
    const finalPosition = isCustomPosition ? customPosition : form.position;

    if (!form.first_name || !form.last_name || !form.tc_kimlik_no || !form.location || !form.section_id || !finalPosition || !form.date_of_birth) {
      return alert("Error: First Name, Last Name, ID, Location, Section, Position, and Date of Birth are mandatory.");
    }
    if (calculateAge(form.date_of_birth) < 18) {
      return alert("🚨 CRITICAL ERROR: Employee must be at least 18.");
    }

    const validDocs = documents.filter(d => d.file && d.type);
    if (documents.some(d => d.file && !d.type)) {
      return alert("Please select a document type for all uploaded files.");
    }

    const sanitizedForm: any = { ...form, position: finalPosition };
    Object.keys(sanitizedForm).forEach(key => { if (sanitizedForm[key] === "") sanitizedForm[key] = null; });

    // 1. Insert Employee
    const { data: newEmp, error } = await supabase.from("employees").insert([{ ...sanitizedForm, status: "active", created_by: user?.id, is_approved: true }]).select().single();
    if (error) return alert(`Database Error: ${error.message}`);

    // 2. Upload Documents
    if (newEmp && validDocs.length > 0) {
      for (const doc of validDocs) {
        const finalType = doc.type === "Other" ? doc.otherSpec || "Other" : doc.type;
        const filePath = `${newEmp.id}/${Date.now()}_${doc.file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
        
        const { error: uploadErr } = await supabase.storage.from('employee-documents').upload(filePath, doc.file);
        if (uploadErr) {
          alert(`Document Upload Failed: ${uploadErr.message}`);
        } else {
          await supabase.from('documents').insert([{
            employee_id: newEmp.id, document_name: doc.file.name, document_type: finalType, file_path: filePath, mime_type: doc.file.type, uploaded_by: user?.id
          }]);
        }
      }
    }

    alert("Employee & Documents successfully added!");
    router.push("/employees");
  };

  if (loading || !user) return null;
  const inp = { width: "100%", padding: "11px 14px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 9, color: "#e8eaf0", outline: "none", boxSizing: "border-box" as const };
  const lbl = { display: "block", color: "#5c6478", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, marginBottom: 5 };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0f14", color: "#e8eaf0", fontFamily: "Outfit, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "30px 40px", marginLeft: 240 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 30 }}>Add New Employee</h1>
        
        <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: 30, maxWidth: 900 }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 30 }}>
            <div><label style={lbl}>Location *</label><select value={form.location || ""} onChange={(e) => setForm({...form, location: e.target.value, section_id: "", position: ""})} style={inp}><option value="">-- Select Location --</option><option value="Beni Suef">Beni Suef</option><option value="Sadat City">Sadat City</option></select></div>
            <div><label style={lbl}>Section *</label><select value={form.section_id || ""} onChange={(e) => setForm({...form, section_id: e.target.value, position: ""})} disabled={!form.location} style={{...inp, opacity: !form.location ? 0.5 : 1}}><option value="">-- Select --</option>{sections.filter(s => s.location === form.location).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div>
              <label style={lbl}>Job Title *</label>
              <select value={isCustomPosition ? "custom_opt" : (form.position || "")} onChange={(e) => { if (e.target.value === "custom_opt") setIsCustomPosition(true); else { setIsCustomPosition(false); setForm({...form, position: e.target.value}); } }} disabled={!form.section_id} style={{...inp, opacity: !form.section_id ? 0.5 : 1}}>
                <option value="">-- Select --</option>{dbPositions.map(pos => <option key={pos} value={pos}>{pos}</option>)}<option value="custom_opt" style={{ fontWeight: "bold", color: "#3b82f6" }}>+ Add Custom...</option>
              </select>
              {isCustomPosition && <input autoFocus placeholder="Type job title..." value={customPosition} onChange={e => setCustomPosition(e.target.value)} style={{...inp, marginTop: 10, border: "1px solid #3b82f6"}} />}
            </div>
          </div>

          <hr style={{ borderTop: "1px solid #252b38", margin: "30px 0" }}/>

          {/* ALL FIELDS PROPERLY RESTORED */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div><label style={lbl}>First Name *</label><input value={form.first_name || ""} onChange={(e)=>setForm({...form, first_name: e.target.value})} style={inp} /></div>
            <div><label style={lbl}>Last Name *</label><input value={form.last_name || ""} onChange={(e)=>setForm({...form, last_name: e.target.value})} style={inp} /></div>
            
            <div><label style={lbl}>TC Kimlik No / ID *</label><input value={form.tc_kimlik_no || ""} onChange={(e)=>setForm({...form, tc_kimlik_no: e.target.value})} style={inp} /></div>
            <div><label style={lbl}>Date of Birth * (Must be 18+)</label><input type="date" value={form.date_of_birth || ""} onChange={(e)=>setForm({...form, date_of_birth: e.target.value})} style={inp} /></div>
            
            <div><label style={lbl}>Phone Number</label><input value={form.phone || ""} onChange={(e)=>setForm({...form, phone: e.target.value})} style={inp} /></div>
            <div><label style={lbl}>Email Address</label><input type="email" value={form.email || ""} onChange={(e)=>setForm({...form, email: e.target.value})} style={inp} /></div>
            
            <div><label style={lbl}>Emergency Contact</label><input value={form.emergency_contact || ""} onChange={(e)=>setForm({...form, emergency_contact: e.target.value})} placeholder="Name & Phone" style={inp} /></div>
            <div><label style={lbl}>Start Date</label><input type="date" value={form.start_date || ""} onChange={(e)=>setForm({...form, start_date: e.target.value})} style={inp} /></div>
            
            <div>
              <label style={lbl}>Gender</label>
              <select value={form.gender || ""} onChange={(e) => setForm({...form, gender: e.target.value})} style={inp}>
                 <option value="">Select...</option><option value="male">Male</option><option value="female">Female</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Marital Status</label>
              <select value={form.marital_status || ""} onChange={(e) => setForm({...form, marital_status: e.target.value})} style={inp}>
                 <option value="">Select...</option><option value="Single">Single</option><option value="Married">Married</option>
              </select>
            </div>

            <div>
              <label style={lbl}>Blood Type</label>
              <select value={form.blood_type || ""} onChange={(e) => setForm({...form, blood_type: e.target.value})} style={inp}>
                 <option value="">Select...</option>
                 {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bt => <option key={bt} value={bt}>{bt}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Gross Salary (Monthly)</label><input type="number" value={form.gross_salary || ""} onChange={(e)=>setForm({...form, gross_salary: e.target.value})} style={inp} /></div>

            <div style={{ gridColumn: "span 2" }}>
              <label style={lbl}>Home Address</label>
              <textarea rows={3} value={form.address || ""} onChange={(e)=>setForm({...form, address: e.target.value})} style={{...inp, resize: "vertical"}} />
            </div>
          </div>

          <hr style={{ borderTop: "1px solid #252b38", margin: "30px 0" }}/>

          {/* DOCUMENT UPLOADER */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#e8eaf0", marginBottom: 15 }}>Employee Documents</h2>
            {documents.map((doc, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: 15, marginBottom: 15, padding: 15, background: "#1a1f2a", borderRadius: 8, border: "1px dashed #3b82f6" }}>
                <div>
                  <select value={doc.type} onChange={(e) => updateDoc(idx, "type", e.target.value)} style={inp}>
                    <option value="">-- Select Document Category --</option>
                    {documentCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {doc.type === "Other" && (
                    <input placeholder="Specify document type..." value={doc.otherSpec} onChange={(e) => updateDoc(idx, "otherSpec", e.target.value)} style={{...inp, marginTop: 10}} />
                  )}
                </div>
                <div>
                  <input type="file" onChange={(e) => updateDoc(idx, "file", e.target.files?.[0] || null)} style={{ color: "#e8eaf0", width: "100%", padding: "8px 0" }} />
                </div>
                {idx > 0 && (
                  <button onClick={() => removeDocRow(idx)} style={{ background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Remove</button>
                )}
              </div>
            ))}
            <button onClick={addDocRow} style={{ color: "#3b82f6", background: "transparent", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              + Add Another Document
            </button>
          </div>

          <button onClick={handleSubmit} style={{ marginTop: 40, width: "100%", padding: "14px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 9, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>Save & Register Employee</button>
        </div>
      </main>
    </div>
  );
}
