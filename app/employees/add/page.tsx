"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import { useTranslation } from "@/lib/i18n";

const sectionJobs: Record<string, string[]> = {
  "Administration": ["HR Manager", "Accountant", "General Manager", "Administrative Assistant", "Driver"],
  "Storage": ["Warehouse Manager", "Forklift Operator", "Inventory Clerk", "Loader"],
  "Machinery Energy": ["Maintenance Manager", "Electrical Technician", "Mechanical Technician", "Boiler Operator"],
  "Weaving": ["Weaving Master", "Loom Operator", "Quality Controller", "Yarn Carrier"],
  "Sizing": ["Sizing Machine Operator", "Chemical Mixer", "Helper"],
  "Confection": ["Sewing Machine Operator", "Pattern Maker", "Ironing Operator", "Packaging Staff", "Confection Supervisor"],
  "Security": ["Security Chief", "Security Guard"],
  "Dyehouse": ["Dyeing Master", "Color Matching Technician", "Chemical Operator", "Dyehouse Helper"]
};

const translateJob = (job: string, lang: string) => {
  const map: Record<string, Record<string, string>> = {
    "HR Manager": { tr: "İK Müdürü", ar: "مدير الموارد البشرية" },
    "Accountant": { tr: "Muhasebeci", ar: "محاسب" },
    "General Manager": { tr: "Genel Müdür", ar: "المدير العام" }
  };
  return map[job]?.[lang] || job; // Returns custom jobs as-is
};

const calculateAge = (dob: string) => {
  if (!dob) return 0;
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

export default function AddEmployeePage() {
  const { user, loading } = useAuth();
  const { t, lang, dir } = useTranslation();
  const router = useRouter();
  
  const [sections, setSections] = useState<any[]>([]);
  const [dbPositions, setDbPositions] = useState<string[]>([]);
  const [isCustomPosition, setIsCustomPosition] = useState(false);
  const [customPosition, setCustomPosition] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    first_name: "", last_name: "", tc_kimlik_no: "", phone: "", email: "",
    location: "", section_id: "", position: "", gross_salary: "",
    date_of_birth: "", start_date: new Date().toISOString().split('T')[0], gender: "", marital_status: "", blood_type: "", address: "", emergency_contact: ""
  });

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);
  
  useEffect(() => {
    supabase.from("sections").select("*").eq("is_active", true).then(({ data }) => setSections(data || []));
  }, []);

  // Fetch historically typed custom positions for the selected section
  useEffect(() => {
    if (form.section_id) {
      supabase.from("employees").select("position").eq("section_id", form.section_id)
        .then(({ data }) => {
          if (data) {
            const uniqueDbPos = Array.from(new Set(data.map(d => d.position).filter(Boolean)));
            setDbPositions(uniqueDbPos as string[]);
          }
        });
    } else {
      setDbPositions([]);
    }
  }, [form.section_id]);

  const availableSections = sections.filter(s => s.location === form.location);
  const selectedSectionName = availableSections.find(s => s.id.toString() === form.section_id)?.name;
  
  // Combine hardcoded positions with database positions
  const basePositions = selectedSectionName ? sectionJobs[selectedSectionName] || [] : [];
  const availablePositions = Array.from(new Set([...basePositions, ...dbPositions]));

  const handleSubmit = async () => {
    const finalPosition = isCustomPosition ? customPosition : form.position;

    if (!form.first_name || !form.last_name || !form.tc_kimlik_no || !form.location || !form.section_id || !finalPosition || !form.date_of_birth) {
      alert("Error: First Name, Last Name, ID, Location, Section, Position, and Date of Birth are mandatory!");
      return;
    }

    if (calculateAge(form.date_of_birth) < 18) {
      alert("🚨 CRITICAL ERROR: Employee must be at least 18 years old to be registered in the system.");
      return;
    }

    const sanitizedForm: any = { ...form, position: finalPosition };
    Object.keys(sanitizedForm).forEach(key => { if (sanitizedForm[key] === "") sanitizedForm[key] = null; });

    const empData = {
      ...sanitizedForm,
      status: "active",
      created_by: user?.id,
      is_approved: user?.role === "hr_employee" ? false : true
    };

    // 1. Insert Employee
    const { data: newEmp, error } = await supabase.from("employees").insert([empData]).select().single();
    if (error) {
      console.error(error);
      alert(`Database Error: ${error.message}`);
      return;
    }

    // 2. Upload Document if provided
    if (newEmp && file) {
      const filePath = `${newEmp.id}/${Date.now()}_${file.name}`;
      await supabase.storage.from('employee-documents').upload(filePath, file);
      await supabase.from('documents').insert([{
        employee_id: newEmp.id, document_name: file.name, document_type: 'other', file_path: filePath, uploaded_by: user?.id
      }]);
    }

    alert("Employee successfully added!");
    router.push("/employees");
  };

  const inp = { width: "100%", padding: "11px 14px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 9, color: "#e8eaf0", outline: "none", boxSizing: "border-box" as const };
  const lbl = { display: "block", color: "#5c6478", fontSize: 11, fontWeight: 500, textTransform: "uppercase" as const, marginBottom: 5 };

  if (loading || !user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0f14", color: "#e8eaf0", fontFamily: "Outfit, sans-serif", direction: dir }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "30px 40px", marginLeft: dir === 'ltr' ? 240 : 0, marginRight: dir === 'rtl' ? 240 : 0 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 30 }}>Add New Employee</h1>
        
        <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: 30, maxWidth: 900 }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 30 }}>
            <div>
              <label style={lbl}>1. Location *</label>
              <select value={form.location || ""} onChange={(e) => setForm({...form, location: e.target.value, section_id: "", position: ""})} style={inp}>
                <option value="">-- Select Location --</option>
                <option value="Beni Suef">Beni Suef</option>
                <option value="Sadat City">Sadat City</option>
              </select>
            </div>
            <div>
              <label style={lbl}>2. Section *</label>
              <select value={form.section_id || ""} onChange={(e) => setForm({...form, section_id: e.target.value, position: ""})} disabled={!form.location} style={{...inp, opacity: !form.location ? 0.5 : 1}}>
                <option value="">-- Select Section --</option>
                {availableSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>3. Job Title *</label>
              <select value={isCustomPosition ? "custom_opt" : (form.position || "")} onChange={(e) => {
                if (e.target.value === "custom_opt") setIsCustomPosition(true);
                else { setIsCustomPosition(false); setForm({...form, position: e.target.value}); }
              }} disabled={!form.section_id} style={{...inp, opacity: !form.section_id ? 0.5 : 1}}>
                <option value="">-- Select Job Title --</option>
                {availablePositions.map(pos => <option key={pos} value={pos}>{translateJob(pos, lang)}</option>)}
                <option value="custom_opt" style={{ fontWeight: "bold", color: "#3b82f6" }}>+ Add Custom Position...</option>
              </select>
              {isCustomPosition && (
                 <input autoFocus placeholder="Type custom job title..." value={customPosition} onChange={e => setCustomPosition(e.target.value)} style={{...inp, marginTop: 10, border: "1px solid #3b82f6"}} />
              )}
            </div>
          </div>

          <hr style={{ borderTop: "1px solid #252b38", margin: "30px 0" }}/>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div><label style={lbl}>First Name *</label><input value={form.first_name || ""} onChange={(e)=>setForm({...form, first_name: e.target.value})} style={inp} /></div>
            <div><label style={lbl}>Last Name *</label><input value={form.last_name || ""} onChange={(e)=>setForm({...form, last_name: e.target.value})} style={inp} /></div>
            <div><label style={lbl}>TC Kimlik No / National ID *</label><input value={form.tc_kimlik_no || ""} onChange={(e)=>setForm({...form, tc_kimlik_no: e.target.value})} style={inp} /></div>
            <div><label style={lbl}>Date of Birth * (Must be 18+)</label><input type="date" value={form.date_of_birth || ""} onChange={(e)=>setForm({...form, date_of_birth: e.target.value})} style={inp} /></div>
            
            <div><label style={lbl}>Phone Number</label><input value={form.phone || ""} onChange={(e)=>setForm({...form, phone: e.target.value})} style={inp} /></div>
            <div><label style={lbl}>Emergency Contact Phone</label><input value={form.emergency_contact || ""} onChange={(e)=>setForm({...form, emergency_contact: e.target.value})} style={inp} /></div>
            
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

            <div style={{ gridColumn: "span 2", padding: 20, background: "#1a1f2a", border: "1px dashed #3b82f6", borderRadius: 9 }}>
              <label style={lbl}>Upload ID or Contract Document (Optional)</label>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ color: "#e8eaf0", width: "100%" }} />
            </div>
          </div>

          <button onClick={handleSubmit} style={{ marginTop: 30, width: "100%", padding: "14px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 9, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
            Save & Register Employee
          </button>
        </div>
      </main>
    </div>
  );
}
