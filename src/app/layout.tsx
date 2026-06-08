"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./globals.css";

const navItems = [
  { href: "/dashboard", label: "数据看板", icon: "📊" },
  { href: "/reviews", label: "审查管理", icon: "📋" },
  { href: "/lottery", label: "抽奖配置", icon: "🎁" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-60 bg-[#1e3a5f] text-white flex flex-col flex-shrink-0">
          <div className="p-5 border-b border-white/10">
            <h1 className="text-base font-semibold tracking-wide">融资审查系统</h1>
            <p className="text-xs text-white/60 mt-1">Digital Finance Admin</p>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${pathname.startsWith(href)
                    ? "bg-white/15 text-white font-medium"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-white/10 text-xs text-white/50">
            v1.0.0
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 bg-[#f8fafc] overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </body>
    </html>
  );
}