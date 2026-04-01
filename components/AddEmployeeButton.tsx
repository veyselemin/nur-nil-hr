"use client";
import { useAuth } from "../lib/auth";
import Link from "next/link";

export default function AddEmployeeButton() {
  const { user } = useAuth();
  if (!user) return null;
  if (!["admin", "hr_manager", "hr_employee"].includes(user.role)) return null;
  return (
    <Link href="/employees/add" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "linear-gradient(135deg, #3b82f6, #6366f1)", border: "none", borderRadius: 9, color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none", fontFamily: "Outfit, sans-serif" }}>+ Add Employee</Link>
  );
}
