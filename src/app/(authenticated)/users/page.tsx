"use client";

import {
  clearCachedUser,
  clearTokens,
  createUser,
  getCachedUser,
  listUsers,
  resetPassword,
  updateUser,
  updateUserStatus,
  type UserItem,
} from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "超级管理员",
  admin: "管理员",
  mobile_user: "移动用户",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  mobile_user: "bg-green-100 text-green-700",
};

export default function UsersPage() {
  const router = useRouter();
  const currentUser = getCachedUser();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      router.push("/login");
    }
  }, [currentUser, router]);

  const [users, setUsers] = useState<UserItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<UserItem | null>(null);
  const [showResetPwd, setShowResetPwd] = useState<UserItem | null>(null);

  // Data loading — inline in effect to avoid sync setState
  useEffect(() => {
    let ignore = false;

    listUsers({
      page,
      pageSize: 20,
      keyword: keyword || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
    })
      .then((res) => {
        if (!ignore) {
          setUsers(res.data);
          setTotalCount(res.total_count);
        }
      })
      .catch(() => {
        if (!ignore) setToast({ msg: "加载用户列表失败", type: "error" });
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, keyword, roleFilter, statusFilter]);

  // Refetch helper for event handlers (create/edit/status-toggle)
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listUsers({
        page,
        pageSize: 20,
        keyword: keyword || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      setUsers(res.data);
      setTotalCount(res.total_count);
    } catch {
      setToast({ msg: "加载用户列表失败", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, keyword, roleFilter, statusFilter]);

  const totalPages = Math.ceil(totalCount / 20);

  const handleLogout = () => {
    clearTokens();
    clearCachedUser();
    router.push("/login");
  };

  if (!currentUser) return null;

  const roleBadge = (role: string) => (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[role] || "bg-gray-100 text-gray-600"}`}>
      {ROLE_LABELS[role] || role}
    </span>
  );

  const statusBadge = (status: string) => (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
      {status === "active" ? "启用" : "禁用"}
    </span>
  );

  const renderActions = (u: UserItem) => (
    <div className="flex gap-2 mt-2 sm:mt-0 sm:justify-end">
      <button onClick={() => setShowEdit(u)} className="text-xs text-[#3b82f6] hover:underline">编辑</button>
      <button
        onClick={async () => {
          const newStatus = u.status === "active" ? "disabled" : "active";
          try {
            await updateUserStatus(u.id, newStatus);
            setToast({ msg: `用户已${newStatus === "active" ? "启用" : "禁用"}`, type: "success" });
            fetchUsers();
          } catch { setToast({ msg: "操作失败", type: "error" }); }
        }}
        className={`text-xs hover:underline ${u.status === "active" ? "text-red-500" : "text-green-600"}`}
      >
        {u.status === "active" ? "禁用" : "启用"}
      </button>
      <button onClick={() => setShowResetPwd(u)} className="text-xs text-orange-500 hover:underline">重置密码</button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">用户管理</h2>
          <p className="text-sm text-gray-500 mt-1">
            当前角色：{ROLE_LABELS[currentUser.role] || currentUser.role}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-[#3b82f6] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors"
          >
            + 新建用户
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="搜索用户名/显示名/手机/邮箱"
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:border-[#3b82f6]"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3b82f6]"
        >
          <option value="">全部角色</option>
          <option value="super_admin">超级管理员</option>
          <option value="admin">管理员</option>
          <option value="mobile_user">移动用户</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3b82f6]"
        >
          <option value="">全部状态</option>
          <option value="active">启用</option>
          <option value="disabled">禁用</option>
        </select>
      </div>

      {/* Loading / Empty */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      )}
      {!loading && users.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-gray-400 text-sm">暂无用户数据</p>
        </div>
      )}

      {/* Mobile: Card list */}
      {!loading && users.length > 0 && (
        <div className="md:hidden space-y-3">
          {users.map((u) => (
            <div key={u.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800">{u.username}</span>
                  <span className="text-gray-400 text-xs ml-2">{u.display_name}</span>
                </div>
                {statusBadge(u.status)}
              </div>
              <div className="flex items-center gap-2">
                {roleBadge(u.role)}
                <span className="text-gray-400 text-xs">|</span>
                <span className="text-gray-500 text-xs">{u.phone || "无手机号"}</span>
              </div>
              <div className="text-xs text-gray-400">
                最近登录：{u.last_login_at ? new Date(u.last_login_at).toLocaleString("zh-CN") : "从未登录"}
              </div>
              <div className="pt-2 border-t border-gray-100">
                {renderActions(u)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop: Table */}
      {!loading && users.length > 0 && (
        <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">用户名</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">显示名称</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">角色</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">手机号</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">最近登录</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.username}</td>
                  <td className="px-4 py-3 text-gray-600">{u.display_name}</td>
                  <td className="px-4 py-3">{roleBadge(u.role)}</td>
                  <td className="px-4 py-3">{statusBadge(u.status)}</td>
                  <td className="px-4 py-3 text-gray-500">{u.phone || "-"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleString("zh-CN") : "从未登录"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {renderActions(u)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded disabled:opacity-30"
          >
            上一页
          </button>
          <span className="text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-30"
          >
            下一页
          </button>
        </div>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <UserFormModal
          title="新建用户"
          onClose={() => setShowCreate(false)}
          onSubmit={async (data) => {
            await createUser(data as { username: string; display_name: string; password: string; role: string; phone?: string; email?: string });
            setShowCreate(false);
            setToast({ msg: "用户创建成功", type: "success" });
            fetchUsers();
          }}
          currentUserRole={currentUser.role}
        />
      )}

      {/* Edit User Modal */}
      {showEdit && (
        <UserFormModal
          title="编辑用户"
          user={showEdit}
          onClose={() => setShowEdit(null)}
          onSubmit={async (data) => {
            await updateUser(showEdit.id, data);
            setShowEdit(null);
            setToast({ msg: "用户信息已更新", type: "success" });
            fetchUsers();
          }}
          currentUserRole={currentUser.role}
        />
      )}

      {/* Reset Password Modal */}
      {showResetPwd && (
        <ResetPasswordModal
          user={showResetPwd}
          onClose={() => setShowResetPwd(null)}
          onSubmit={async (password) => {
            await resetPassword(showResetPwd.id, password);
            setShowResetPwd(null);
            setToast({ msg: "密码已重置", type: "success" });
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 px-4 py-2.5 rounded-lg text-sm text-white shadow-lg cursor-pointer transition-opacity z-50 ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
          onClick={() => setToast(null)}
        >
          {toast.msg}
        </div>
      )}

      {/* Bottom nav */}
      <div className="text-center">
        <Link href="/dashboard" className="text-sm text-[#3b82f6] hover:underline">
          ← 返回数据看板
        </Link>
      </div>
    </div>
  );
}

// --- User Form Modal ---

function UserFormModal({
  title,
  user,
  onSubmit,
  onClose,
  currentUserRole,
}: {
  title: string;
  user?: UserItem;
  onSubmit: (data: Record<string, string>) => Promise<void>;
  onClose: () => void;
  currentUserRole: string;
}) {
  const [form, setForm] = useState({
    username: user?.username || "",
    display_name: user?.display_name || "",
    password: "",
    role: user?.role || "mobile_user",
    phone: user?.phone || "",
    email: user?.email || "",
    status: user?.status || "active",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEdit = !!user;
  const isAdmin = currentUserRole === "admin";

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isEdit) {
      if (!form.username.trim()) { setError("请输入用户名"); return; }
      if (!form.password) { setError("请输入密码"); return; }
      if (form.password.length < 6) { setError("密码至少6位"); return; }
    }
    if (!form.display_name.trim()) { setError("请输入显示名称"); return; }

    setLoading(true);
    try {
      const data: Record<string, string> = {};
      if (!isEdit) {
        data.username = form.username;
        data.password = form.password;
        data.role = form.role;
      }
      data.display_name = form.display_name;
      if (form.phone) data.phone = form.phone;
      if (form.email) data.email = form.email;
      if (form.role !== user?.role) data.role = form.role;
      if (form.status !== user?.status) data.status = form.status;

      await onSubmit(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "操作失败";
      if (msg.includes("USER_ALREADY_EXISTS")) {
        setError("用户名已存在");
      } else if (msg.includes("USER_ROLE_ILLEGAL")) {
        setError("无权设置该角色");
      } else if (msg.includes("AUTH_FORBIDDEN")) {
        setError("无权限执行此操作");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3b82f6]";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-[440px] mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isEdit && (
            <>
              <div>
                <label className="block text-sm text-gray-600 mb-1">用户名 *</label>
                <input type="text" value={form.username} onChange={(e) => update("username", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">密码 *</label>
                <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="至少6位" className={inputClass} />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm text-gray-600 mb-1">显示名称 *</label>
            <input type="text" value={form.display_name} onChange={(e) => update("display_name", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">角色</label>
            <select value={form.role} onChange={(e) => update("role", e.target.value)} className={inputClass}>
              <option value="mobile_user">移动用户</option>
              <option value="admin">管理员</option>
              {!isAdmin && <option value="super_admin">超级管理员</option>}
            </select>
            {isAdmin && <p className="text-xs text-gray-400 mt-1">管理员不能创建/提升为超级管理员</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">手机号</label>
            <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">邮箱</label>
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} />
          </div>
          {isEdit && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">状态</label>
              <select value={form.status} onChange={(e) => update("status", e.target.value)} className={inputClass}>
                <option value="active">启用</option>
                <option value="disabled">禁用</option>
              </select>
            </div>
          )}
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">取消</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50">
              {loading ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Reset Password Modal ---

function ResetPasswordModal({
  user,
  onClose,
  onSubmit,
}: {
  user: UserItem;
  onClose: () => void;
  onSubmit: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("密码至少6位"); return; }
    if (password !== confirm) { setError("两次密码不一致"); return; }

    setLoading(true);
    try {
      await onSubmit(password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3b82f6]";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-[400px] mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">重置密码 — {user.display_name || user.username}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">新密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少6位" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">确认密码</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="再次输入" className={inputClass} />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">取消</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
              {loading ? "重置中..." : "确认重置"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}