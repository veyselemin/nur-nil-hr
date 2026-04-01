"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/lib/i18n";
import Sidebar from "@/components/Sidebar";

const BENI_SUEF_SECTIONS = ["Administration","Storage","Machinery Energy","Weaving","Sizing","Confection","Security"];
const SADAT_SECTIONS = ["Administration","Storage","Machinery Energy","Confection","Security","Dyehouse"];

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ total:0, active:0, pending:0, onLeave:0 });
  const [beniSuefSections, setBeniSuefSections] = useState<any[]>([]);
  const [sadatSections, setSadatSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      if (!profile) { router.push("/login"); return; }
      setUser(profile);
      const { data: emps } = await supabase.from("employees").select("status, is_approved");
      if (emps) setStats({ total: emps.length, active: emps.filter(e=>e.status==="active").length, pending: emps.filter((e:any)=>!e.is_approved).length, onLeave: emps.filter(e=>e.status==="on_leave").length });
      const { data: sections } = await supabase.from("sections").select("*").eq("is_active", true).order("name");
      if (sections) { setBeniSuefSections(sections.filter((s:any)=>s.location==="Beni Suef")); setSadatSections(sections.filter((s:any)=>s.location==="Sadat City")); }
      setLoading(false);
    });
  }, []);

  if (loading || !user) return <div style={{ background:"#0d1117", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:"#e2e8f0", fontFamily:"Outfit, sans-serif" }}>Loading...</div>;

  const statCards = [
    { label: t("dash.total_employees"), value: stats.total, color: "#3b82f6" },
    { label: t("dash.active"), value: stats.active, color: "#22c55e" },
    { label: t("dash.pending_approval"), value: stats.pending, color: "#f59e0b" },
    { label: t("dash.on_leave"), value: stats.onLeave, color: "#8b5cf6" },
  ];

  const SectionRow = ({ name, sections }: { name: string; sections: any[] }) => {
    const sec = sections.find(s => s.name === name);
    return (
      <div style={{ background:"#13171e", border:"1px solid #252b38", borderRadius:8, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background: sec?"#22c55e":"#374151" }} />
          <span style={{ fontSize:13, fontWeight:500, color:"#e2e8f0" }}>{name}</span>
        </div>
        <span style={{ fontSize:11, color:"#5c6478" }}>{sec ? "Active" : "—"}</span>
      </div>
    );
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#0d1117", fontFamily:"Outfit, sans-serif", color:"#e2e8f0" }}>
      <Sidebar />
      <main style={{ flex:1, padding:"28px 32px", overflowY:"auto" }}>
        <div style={{ marginBottom:28 }}>
          <h1 style={{ margin:0, fontSize:22, fontWeight:700 }}>{t("dash.title")}</h1>
          <p style={{ margin:"4px 0 0", color:"#5c6478", fontSize:13 }}>Beni Suef & Sadat City</p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:32 }}>
          {statCards.map(c => (
            <div key={c.label} style={{ background:"#13171e", border:"1px solid #252b38", borderRadius:12, padding:"20px 22px" }}>
              <p style={{ margin:0, fontSize:11, color:"#5c6478", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em" }}>{c.label}</p>
              <p style={{ margin:"8px 0 0", fontSize:30, fontWeight:700, color:c.color }}>{c.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
          <div>
            <div style={{ padding:"12px 16px", background:"#13171e", border:"1px solid #1e3a5f", borderRadius:10, marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:14, fontWeight:700, color:"#3b82f6" }}>Beni Suef Factory</span>
              <span style={{ fontSize:11, color:"#5c6478" }}>7 sections</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {BENI_SUEF_SECTIONS.map(name => <SectionRow key={name} name={name} sections={beniSuefSections} />)}
            </div>
          </div>
          <div>
            <div style={{ padding:"12px 16px", background:"#13171e", border:"1px solid #2d1b69", borderRadius:10, marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:14, fontWeight:700, color:"#8b5cf6" }}>Sadat City Factory</span>
              <span style={{ fontSize:11, color:"#5c6478" }}>6 sections</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {SADAT_SECTIONS.map(name => <SectionRow key={name} name={name} sections={sadatSections} />)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
