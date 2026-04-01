"use client";
import { useState } from "react";
import { useAuth } from "../../lib/auth";
import { useRouter } from "next/navigation";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  async function handleLogin() {
    setLoading(true); setError("");
    const err = await signIn(email, password);
    if (err) { setError(err); setLoading(false); } else { router.push("/dashboard"); }
  }
  const inp: React.CSSProperties = { width: "100%", padding: "12px 14px", background: "#1a1f2a", border: "1px solid #252b38", borderRadius: 10, color: "#e8eaf0", fontSize: 14, fontFamily: "Outfit, sans-serif", outline: "none", boxSizing: "border-box" };
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0c0f14 0%, #0f1520 50%, #111827 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Outfit, sans-serif", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ width: 48, height: 48, margin: "0 auto 16px", background: "linear-gradient(135deg, #3b82f6, #6366f1)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>N</span></div>
          <h1 style={{ color: "#e8eaf0", fontSize: 26, fontWeight: 700, margin: 0 }}>NUR NIL TEKSTIL</h1>
          <p style={{ color: "#5c6478", fontSize: 13, margin: "8px 0 0", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 500 }}>Human Resources Platform</p>
        </div>
        <div style={{ background: "#13171e", border: "1px solid #252b38", borderRadius: 16, padding: "36px 32px" }}>
          <p style={{ color: "#8891a4", fontSize: 14, margin: "0 0 24px", textAlign: "center" }}>Sign in to your account</p>
          {error && (<div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#ef4444", fontSize: 13 }}>{error}</div>)}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#8891a4", fontSize: 12, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} placeholder="admin@nurniltekstil.com" style={inp} />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", color: "#8891a4", fontSize: 12, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} placeholder="Enter password" style={inp} />
          </div>
          <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "13px", background: loading ? "#5c6478" : "linear-gradient(135deg, #3b82f6, #6366f1)", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 600, fontFamily: "Outfit, sans-serif", cursor: loading ? "wait" : "pointer" }}>{loading ? "Signing in..." : "Sign In"}</button>
          <div style={{ marginTop: 28, padding: 16, background: "#1a1f2a", borderRadius: 10, border: "1px solid #252b38" }}>
            <p style={{ color: "#5c6478", fontSize: 11, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Demo Accounts</p>
            <p style={{ color: "#8891a4", fontSize: 12, margin: "0 0 4px" }}>admin@nurniltekstil.com</p>
            <p style={{ color: "#8891a4", fontSize: 12, margin: "0 0 4px" }}>hr.manager@nurniltekstil.com</p>
            <p style={{ color: "#8891a4", fontSize: 12, margin: "0 0 4px" }}>hr.employee@nurniltekstil.com</p>
            <p style={{ color: "#8891a4", fontSize: 12, margin: 0 }}>section.mgr@nurniltekstil.com</p>
            <p style={{ color: "#5c6478", fontSize: 11, margin: "8px 0 0" }}>Password for all: Test123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
