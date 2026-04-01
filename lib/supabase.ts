import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://omaoifzarsdvqyrqtztg.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tYW9pZnphcnNkdnF5cnF0enRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MDA1MDksImV4cCI6MjA5MDQ3NjUwOX0.xRs40N0krdDwBoXFcyY67LU8Bw4ItXEDgGOTM2ktyWw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
