import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../lib/auth";
import { I18nProvider } from "../lib/i18n";
export const metadata: Metadata = { title: "NUR NIL TEKSTIL - HR Platform", description: "Human Resources Management Platform" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" /></head>
      <body style={{ margin: 0, background: "#0c0f14", fontFamily: "Outfit, sans-serif" }}>
        <I18nProvider><AuthProvider>{children}</AuthProvider></I18nProvider>
      </body>
    </html>
  );
}
