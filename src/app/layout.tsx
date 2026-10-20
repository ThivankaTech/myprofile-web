import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { withBasePath } from "@/lib/basePath";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Profile",
  description: "Personal profile — journey, work experience, education, and travels.",
  // next/og's icon.tsx convention doesn't prefix its generated <link> href
  // with basePath (confirmed: identical broken href with or without
  // basePath set), so a static file + explicit withBasePath() is used
  // instead, matching every other raw-asset-path fix in this project.
  icons: { icon: withBasePath("/icon.png") },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-fg">{children}</body>
    </html>
  );
}
