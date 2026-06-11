"use client";

import { login } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("请输入账号和密码");
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "登录失败";
      // Generic message — don't reveal whether user exists (DESIGN_DOC 28.1 item 1)
      if (msg.includes("AUTH_INVALID_CREDENTIALS") || msg.includes("AUTH_FORBIDDEN")) {
        setError("账号或密码错误");
      } else if (msg.includes("AUTH_ACCOUNT_DISABLED")) {
        setError("账号已被禁用，请联系管理员");
      } else {
        setError("登录失败，请稍后重试");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
      <div className="w-full max-w-[400px] bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1e3a5f]">融资审查系统</h1>
          <p className="text-sm text-gray-500 mt-2">Digital Finance Admin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">账号</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入账号"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#1e3a5f] text-white rounded-lg font-medium text-sm hover:bg-[#162d4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "登录中..." : "登 录"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          还没有账号？{" "}
          <Link href="/register" className="text-[#3b82f6] hover:underline font-medium">
            注册新账号
          </Link>
        </div>
      </div>
    </div>
  );
}