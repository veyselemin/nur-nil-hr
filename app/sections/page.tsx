"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

export default function SectionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [sectionsData, setSectionsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (user) fetchSections();
  }, [user, loading, router]);

  const fetchSections = async () => {
    setIsLoading(true);
    // We use the section_dashboard view we created in SQL to get live employee counts!
    const { data, error } = await supabase
      .from("section_dashboard")
      .select("*")
      .order("section_name", { ascending: true });
      
    if (error) {
      console.error("Error fetching sections:", error);
    } else {
      setSectionsData(data || []);
    }
    setIsLoading(false);
  };

  if (loading || !user) return <div style={{ background: "#0c0f14", minHeight: "100vh" }} />;

  // Group the data by Location
  const beniSuefSections = sectionsData.filter(s => s.location === "Beni Suef");
  const sadatCitySections = sectionsData.filter(s => s.location === "Sadat City");

  const SectionCard = ({ section }: { section: any }) => (
    <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 12, padding: 20, transition: "transform 0.2s", cursor: "pointer" }} 
         onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
         onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 15 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#fff", margin: 0 }}>{section.section_name}</h3>
        <span style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
          {section.location}
        </span>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20 }}>
        <div style={{ background: "#1a1f2a", padding: "12px", borderRadius: 8, border: "1px solid #252b38" }}>
          <div style={{ fontSize: 11, color: "#8891a4", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Total Staff</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#e8eaf0" }}>{section.total_employees || 0}</div>
        </div>
        <div style={{ background: "#1a1f2a", padding: "12px", borderRadius: 8, border: "1px solid #252b38" }}>
          <div style={{ fontSize: 11, color: "#8891a4", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Active</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#10b981" }}>{section.active_count || 0}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0f14", color: "#e8eaf0", fontFamily: "Outfit, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "30px 40px", marginLeft: 240 }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Factory Sections</h1>
            <p style={{ color: "#8891a4", marginTop: 5, fontSize: 14 }}>Overview of departments across all locations</p>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: 50, color: "#8891a4" }}>Loading sections...</div>
        ) : (
          <>
            {/* BENI SUEF GRID */}
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#3b82f6" }} />
                <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Beni Suef Plant</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                {beniSuefSections.map(section => <SectionCard key={section.section_id} section={section} />)}
              </div>
            </div>

            <hr style={{ borderTop: "1px dashed #252b38", margin: "40px 0" }} />

            {/* SADAT CITY GRID */}
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#8b5cf6" }} />
                <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Sadat City Plant</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                {sadatCitySections.map(section => <SectionCard key={section.section_id} section={section} />)}
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
}
