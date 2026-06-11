import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "融资审查系统",
  description: "Digital Finance 融资审查管理系统",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}