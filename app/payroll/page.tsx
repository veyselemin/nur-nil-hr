"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import Sidebar from "../../components/Sidebar";
import { useI18n } from "../../lib/i18n";
export default function PayrollPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  useEffect(() => { if (!loading && !user) router.push("/login"); if (!loading && user && (user.role === "section_manager")) router.push("/dashboard"); }, [user, loading, router]);
  useEffect(() => { if (user) loadData(); }, [user]);
  async function loadData() { const { data } = await supabase.from("employees").select("*, sections(name)").eq("is_approved", true).order("full_name"); if (data) setEmployees(data); }
  if (loading || !user) return null;
  const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);
  const totalGross = employees.reduce((s, e) => s + e.gross_salary, 0);
  const avgSalary = employees.length > 0 ? Math.round(totalGross / employees.length) : 0;
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0f14", color: "#e8eaf0", fontFamily: "Outfit, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 240 }}>
        <header style={{ padding: "18px 32px", borderBottom: "1px solid #252b38", background: "#13171e", position: "sticky", top: 0, zIndex: 50 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t("pay.title")}</h1>
        </header>
        <div style={{ padding: "28px 32px" }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
            <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: "22px 20px", flex: 1, minWidth: 220 }}><span style={{ color: "#5c6478", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("pay.total")}</span><div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, color: "#22c55e" }}>TRY {fmt(totalGross)}</div><div style={{ fontSize: 12, color: "#8891a4", marginTop: 4 }}>{employees.length} {t("common.employees")}</div></div>
            <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: "22px 20px", flex: 1, minWidth: 220 }}><span style={{ color: "#5c6478", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("pay.average")}</span><div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>TRY {fmt(avgSalary)}</div><div style={{ fontSize: 12, color: "#8891a4", marginTop: 4 }}>{t("pay.per_emp")}</div></div>
            <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, padding: "22px 20px", flex: 1, minWidth: 220 }}><span style={{ color: "#5c6478", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("pay.net_total")}</span><div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>TRY {fmt(Math.round(totalGross * 0.72))}</div><div style={{ fontSize: 12, color: "#8891a4", marginTop: 4 }}>{t("pay.after_ded")}</div></div>
          </div>
          <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 14, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: "1px solid #252b38" }}>{[t("emp.employee"), t("emp.section"), t("pay.gross"), t("pay.ssk"), t("pay.tax"), t("pay.net")].map((h) => (<th key={h} style={{ padding: "14px 16px", textAlign: "left", color: "#5c6478", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>))}</tr></thead>
              <tbody>{employees.map((emp) => (<tr key={emp.id} style={{ borderBottom: "1px solid #252b38" }}><td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500 }}>{emp.full_name}</td><td style={{ padding: "12px 16px", fontSize: 13, color: "#8891a4" }}>{emp.sections?.name}</td><td style={{ padding: "12px 16px", fontSize: 13 }}>TRY {fmt(emp.gross_salary)}</td><td style={{ padding: "12px 16px", fontSize: 13, color: "#8891a4" }}>TRY {fmt(Math.round(emp.gross_salary * 0.14))}</td><td style={{ padding: "12px 16px", fontSize: 13, color: "#8891a4" }}>TRY {fmt(Math.round(emp.gross_salary * 0.15))}</td><td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#22c55e" }}>TRY {fmt(Math.round(emp.gross_salary * 0.72))}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
