"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

export default function EditEmployeePage() {
  const params = useParams();
  const id = params?.id;
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [sections, setSections] = useState<any[]>([]);
  const [dbPositions, setDbPositions] = useState<string[]>([]);
  const [isCustomPosition, setIsCustomPosition] = useState(false);
  const [customPosition, setCustomPosition] = useState("");

  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    supabase.from("sections").select("*").then(({ data }) => setSections(data || []));
    
    if (id) {
      // Fetch Employee Data
      supabase.from("employees").select("*").eq("id", id).single().then(({ data, error }) => {
        if (error) {
          console.error("Fetch error:", error);
          alert("Could not load employee.");
        } else if (data) {
          setForm(data);
        }
      });
    }
  }, [id, user, loading, router]);

  useEffect(() => {
    if (form?.section_id) {
      supabase.from("employees").select("position").eq("section_id", form.section_id)
        .then(({ data }) => {
          if (data) {
            const uniqueDbPos = Array.from(new Set(data.map(d => d.position).filter(Boolean)));
            setDbPositions(uniqueDbPos as string[]);
          }
        });
    }
  }, [form?.section_id]);

  const handleSubmit = async () => {
    const finalPosition = isCustomPosition ? customPosition : form.position;
    const sanitizedForm = { ...form, position: finalPosition };
    
    // Convert empty strings to null for database safety
    Object.keys(sanitizedForm).forEach(key => { 
      if (sanitizedForm[key] === "") sanitizedForm[key] = null; 
    });

    const { error } = await supabase.from("employees").update(sanitizedForm).eq("id", id);
    if (error) {
      alert(`Error updating: ${error.message}`);
    } else {
      alert("Employee updated successfully!");
      router.push(`/employees`);
    }
  };

  if (!form) return <div style={{background: "#0c0f14", minHeight:"100vh", color:"white", padding: 50}}>Loading Employee Data...</div>;

  const inp = { width: "100%", padding: "11px 14px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 9, color: "#e8eaf0", outline: "none", boxSizing: "border-box" as const };
  const lbl = { display: "block", color: "#5c6478", fontSize: 11, fontWeight: 500, textTransform: "uppercase" as const, marginBottom: 5 };
  const availableSections = sections.filter(s => s.location === form.location);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0f14", color: "#e8eaf0", fontFamily: "Outfit, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "30px 40px", marginLeft: 240 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 30 }}>Edit Employee: {form.first_name} {form.last_name}</h1>
        
        <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: 30, maxWidth: 900 }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 30 }}>
            <div>
              <label style={lbl}>Location</label>
              <select value={form.location || ""} onChange={(e) => setForm({...form, location: e.target.value, section_id: ""})} style={inp}>
                <option value="Beni Suef">Beni Suef</option>
                <option value="Sadat City">Sadat City</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Section</label>
              <select value={form.section_id || ""} onChange={(e) => setForm({...form, section_id: e.target.value})} style={inp}>
                <option value="">-- Select --</option>
                {availableSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Job Title</label>
              <select value={isCustomPosition ? "custom_opt" : (form.position || "")} onChange={(e) => {
                if (e.target.value === "custom_opt") setIsCustomPosition(true);
                else { setIsCustomPosition(false); setForm({...form, position: e.target.value}); }
              }} style={inp}>
                <option value="">-- Select --</option>
                {dbPositions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                {!dbPositions.includes(form.position) && form.position && <option value={form.position}>{form.position}</option>}
                <option value="custom_opt" style={{ fontWeight: "bold", color: "#10b981" }}>+ Type Custom Position...</option>
              </select>
              {isCustomPosition && <input autoFocus value={customPosition} onChange={e => setCustomPosition(e.target.value)} style={{...inp, marginTop: 10}} placeholder="Type position here..." />}
            </div>
          </div>

          <hr style={{ borderTop: "1px solid #252b38", margin: "30px 0" }}/>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div><label style={lbl}>First Name</label><input value={form.first_name || ""} onChange={(e)=>setForm({...form, first_name: e.target.value})} style={inp} /></div>
            <div><label style={lbl}>Last Name</label><input value={form.last_name || ""} onChange={(e)=>setForm({...form, last_name: e.target.value})} style={inp} /></div>
            <div><label style={lbl}>TC Kimlik / ID</label><input value={form.tc_kimlik_no || ""} onChange={(e)=>setForm({...form, tc_kimlik_no: e.target.value})} style={inp} /></div>
            <div><label style={lbl}>Date of Birth</label><input type="date" value={form.date_of_birth || ""} onChange={(e)=>setForm({...form, date_of_birth: e.target.value})} style={inp} /></div>
            <div><label style={lbl}>Phone Number</label><input value={form.phone || ""} onChange={(e)=>setForm({...form, phone: e.target.value})} style={inp} /></div>
            <div><label style={lbl}>Emergency Contact</label><input value={form.emergency_contact || ""} onChange={(e)=>setForm({...form, emergency_contact: e.target.value})} style={inp} /></div>
            <div><label style={lbl}>Email Address</label><input type="email" value={form.email || ""} onChange={(e)=>setForm({...form, email: e.target.value})} style={inp} /></div>
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
          
          <div style={{ display: "flex", gap: 15, marginTop: 30 }}>
            <button onClick={() => router.push('/employees')} style={{ flex: 1, padding: "14px", background: "transparent", color: "#e8eaf0", border: "1px solid #5c6478", borderRadius: 9, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={handleSubmit} style={{ flex: 2, padding: "14px", background: "#10b981", color: "#13171e", border: "none", borderRadius: 9, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              Save Changes
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
