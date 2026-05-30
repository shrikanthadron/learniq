import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProviders } from "@/components/auth/AuthProviders";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
  title: "LearnIQ — AI-Powered Learning Platform",
  description: "Personalized learning, intelligent quizzes, smart scheduling, and performance analytics",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${space.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProviders>
            <AuthProvider>{children}</AuthProvider>
          </AuthProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
