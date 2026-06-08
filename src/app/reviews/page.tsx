"use client";

import { login as apiLogin, deleteReview, listReviews, type ReviewResponse } from "@/lib/api";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  const fetchReviews = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await listReviews(p, pageSize);
      setReviews(res.data);
      setTotalCount(res.total_count);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    apiLogin("admin", "admin")
      .then(() => {
        setAuthReady(true);
        return fetchReviews(1);
      })
      .catch(() => setLoading(false));
  }, [fetchReviews]);

  // Client-side search/filter over fetched data
  const filtered = reviews.filter((r) => {
    if (search && !r.customer_name.includes(search)) return false;
    if (filter && r.credit_status !== filter) return false;
    return true;
  });

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchReviews(newPage);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此审查报告吗？")) return;
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert("删除失败");
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      "正常": "badge badge-success",
      "关注": "badge badge-warning",
      "当前逾期": "badge badge-error",
      "呆账": "badge badge-error",
      "代偿": "badge badge-error",
      "法诉": "badge badge-error",
      "其他": "badge badge-ghost",
      "情况说明": "badge badge-ghost",
    };
    return map[status] ?? "badge badge-ghost";
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">📋 审查管理</h2>
        {!authReady && <span className="badge badge-warning">未连接服务器</span>}
        {authReady && (
          <span className="text-sm text-gray-400">共 {totalCount} 条记录</span>
        )}
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="搜索客户姓名..."
          className="input input-bordered input-sm w-64"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          className="select select-bordered select-sm"
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
        >
          <option value="">全部征信状态</option>
          {["正常", "关注", "当前逾期", "呆账", "代偿", "法诉", "其他", "情况说明"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">暂无匹配数据</p>
        ) : (
          <table className="table table-zebra">
            <thead>
              <tr className="text-xs text-gray-500">
                <th>客户姓名</th>
                <th>性别</th>
                <th>年龄</th>
                <th>需求额度</th>
                <th>征信状态</th>
                <th>AI 评分</th>
                <th>风险等级</th>
                <th>提交时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="text-sm hover">
                  <td className="font-medium">{r.customer_name}</td>
                  <td>{r.gender}</td>
                  <td>{r.age}</td>
                  <td>{r.loan_amount.toLocaleString()} 元</td>
                  <td><span className={statusBadge(r.credit_status)}>{r.credit_status}</span></td>
                  <td>{(r.ai_score ?? 0) > 0 ? r.ai_score : "—"}</td>
                  <td>{r.ai_risk_level ?? "—"}</td>
                  <td className="text-gray-400">{new Date(r.created_at).toLocaleDateString("zh-CN")}</td>
                  <td className="flex gap-1">
                    <Link href={`/reviews/${r.id}`} className="btn btn-xs btn-outline btn-primary">
                      查看详情
                    </Link>
                    <button
                      className="btn btn-xs btn-outline btn-error"
                      onClick={() => handleDelete(r.id)}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            className="btn btn-sm"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            上一页
          </button>
          <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
          <button
            className="btn btn-sm"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}