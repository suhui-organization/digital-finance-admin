"use client";

import { register } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    phone: "",
    email: "",
    inviteCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.username.trim() || !form.password || !form.displayName.trim()) {
      setError("请填写必填字段（账号、密码、显示名称）");
      return;
    }

    if (form.username.length < 3) {
      setError("账号长度至少3位");
      return;
    }

    if (form.password.length < 6) {
      setError("密码长度至少6位");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    try {
      await register(
        form.username,
        form.password,
        form.displayName,
        form.phone || undefined,
        form.email || undefined,
        form.inviteCode || undefined
      );
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "注册失败";
      if (msg.includes("USER_ALREADY_EXISTS")) {
        setError("该账号已被注册");
      } else {
        setError(msg || "注册失败，请稍后重试");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] py-10">
      <div className="w-full max-w-[420px] bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1e3a5f]">注册管理员账号</h1>
          <p className="text-sm text-gray-500 mt-2">创建您的管理后台账号</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              账号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
              placeholder="至少3个字符"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              显示名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => update("displayName", e.target.value)}
              placeholder="您的姓名或昵称"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密码 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="至少6位"
              className={inputClass}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              确认密码 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              placeholder="再次输入密码"
              className={inputClass}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="选填"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="选填"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邀请码</label>
            <input
              type="text"
              value={form.inviteCode}
              onChange={(e) => update("inviteCode", e.target.value)}
              placeholder="选填"
              className={inputClass}
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
            {loading ? "注册中..." : "注册并登录"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          已有账号？{" "}
          <Link href="/login" className="text-[#3b82f6] hover:underline font-medium">
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
}