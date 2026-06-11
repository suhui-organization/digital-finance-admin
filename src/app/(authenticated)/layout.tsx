"use client";

import { clearCachedUser, clearTokens, getCachedUser, logout } from "@/lib/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "超级管理员",
  admin: "管理员",
  mobile_user: "移动用户",
};

const BASE_NAV_ITEMS = [
  { href: "/dashboard", label: "数据看板", icon: "📊" },
  { href: "/reviews", label: "审查管理", icon: "📋" },
  { href: "/lottery", label: "抽奖配置", icon: "🎁" },
  { href: "/users", label: "用户管理", icon: "👥" },
];

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // 延迟读取 localStorage 以避免 SSR hydration mismatch
  const [user, setUser] = useState<ReturnType<typeof getCachedUser>>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setUser(getCachedUser());
  }, []);

  // 路由变化时自动关闭移动端侧边栏
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch {
      // best effort
    }
    clearTokens();
    clearCachedUser();
    router.push("/login");
  }, [router]);

  // 服务端和客户端首次渲染都展示一致的 loading 骨架
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col lg:flex-row">
        <div className="w-full lg:w-60 bg-[#1e3a5f] h-14 lg:h-auto lg:min-h-screen flex-shrink-0" />
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          加载中...
        </div>
      </div>
    );
  }

  const canManageQr = user.role === "admin" || user.role === "super_admin";
  const navItems = canManageQr
    ? [...BASE_NAV_ITEMS, { href: "/qrcode", label: "二维码中心", icon: "🔳" }]
    : BASE_NAV_ITEMS;

  const sidebarContent = (
    <>
      <div className="p-5 border-b border-white/10">
        <h1 className="text-base font-semibold tracking-wide">融资审查系统</h1>
        <p className="text-xs text-white/60 mt-1">Digital Finance Admin</p>
      </div>

      <div className="px-4 py-3 border-b border-white/10 text-sm">
        <div className="text-white/90 font-medium truncate">{user.display_name || user.username}</div>
        <div className="text-white/50 text-xs mt-0.5">{ROLE_LABELS[user.role] || user.role}</div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
              pathname.startsWith(href)
                ? "bg-white/15 text-white font-medium"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          🚪 退出登录
        </button>
        <div className="text-xs text-white/30">v1.0.0</div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* 移动端顶部导航栏 */}
      <div className="lg:hidden flex items-center justify-between px-4 h-14 bg-[#1e3a5f] text-white flex-shrink-0">
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="p-2 -ml-2 rounded-md hover:bg-white/10 transition-colors"
          aria-label="打开菜单"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-sm font-semibold truncate ml-2">融资审查系统</span>
        <button
          onClick={handleLogout}
          className="p-2 -mr-2 rounded-md hover:bg-white/10 transition-colors text-white/70"
          aria-label="退出登录"
        >
          🚪
        </button>
      </div>

      {/* 桌面端固定侧边栏 */}
      <aside className="hidden lg:flex flex-col w-60 bg-[#1e3a5f] text-white flex-shrink-0 min-h-screen">
        {sidebarContent}
      </aside>

      {/* 移动端抽屉式侧边栏 */}
      {sidebarOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          {/* 抽屉面板 */}
          <aside className="lg:hidden fixed inset-y-0 left-0 w-64 bg-[#1e3a5f] text-white flex flex-col z-50 shadow-2xl transition-transform duration-300">
            {sidebarContent}
          </aside>
        </>
      )}

      {/* 主内容区 */}
      <main className="flex-1 bg-[#f8fafc] overflow-auto min-h-screen">
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}