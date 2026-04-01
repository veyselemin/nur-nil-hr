"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "./supabase";
import { UserRole } from "./types";
interface AuthUser { id: string; email: string; full_name: string; role: UserRole; section_id: number | null; }
interface AuthContextType { user: AuthUser | null; loading: boolean; signIn: (email: string, password: string) => Promise<string | null>; signOut: () => Promise<void>; }
const AuthContext = createContext<AuthContextType>({ user: null, loading: true, signIn: async () => null, signOut: async () => {} });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { checkUser(); const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { checkUser(); }); return () => subscription.unsubscribe(); }, []);
  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        if (profile) { setUser({ id: profile.id, email: profile.email, full_name: profile.full_name, role: profile.role, section_id: profile.section_id }); } else { setUser(null); }
      } else { setUser(null); }
    } catch { setUser(null); }
    setLoading(false);
  }
  async function signIn(email: string, password: string) { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) return error.message; await checkUser(); return null; }
  async function signOut() { await supabase.auth.signOut(); setUser(null); }
  return (<AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>);
}
export function useAuth() { return useContext(AuthContext); }
