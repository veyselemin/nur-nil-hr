"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth";
export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading) { if (user) router.push("/dashboard"); else router.push("/login"); } }, [user, loading, router]);
  return (<div style={{ minHeight: "100vh", background: "#0c0f14", display: "flex", alignItems: "center", justifyContent: "center", color: "#8891a4" }}><p>Loading...</p></div>);
}
