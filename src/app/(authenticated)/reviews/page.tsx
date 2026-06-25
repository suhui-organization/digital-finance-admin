"use client";

import { deleteReview, listReviews, type ReviewResponse } from "@/lib/api";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
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

  // Initial data load on mount — no synchronous setState in effect body
  useEffect(() => {
    let ignore = false;

    listReviews(1, pageSize)
      .then((res) => {
        if (!ignore) {
          setReviews(res.data);
          setTotalCount(res.total_count);
        }
      })
      .catch(() => {
        // silent
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // local filters
  const filtered = reviews
    .filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.customer_name.toLowerCase().includes(q) ||
        r.credit_status.toLowerCase().includes(q) ||
        (r.main_bank && r.main_bank.toLowerCase().includes(q))
      );
    })
    .filter((r) => {
      if (!filter) return true;
      if (filter === "matched") return r.can_match;
      if (filter === "unmatched") return !r.can_match;
      if (filter === "highRisk") return r.ai_risk_level === "高" || r.ai_risk_level === "极高" || r.ai_risk_level === "D";
      return true;
    });

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此审查记录？")) return;
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setTotalCount((prev) => prev - 1);
    } catch {
      alert("删除失败");
    }
  };

  // Pagination: update page state then fetch — both in event handler, no effect cascade
  const goToPrevPage = () => {
    const newPage = page - 1;
    setPage(newPage);
    fetchReviews(newPage);
  };

  const goToNextPage = () => {
    const newPage = page + 1;
    setPage(newPage);
    fetchReviews(newPage);
  };

  const typeBadge = (r: ReviewResponse) => (
    <span className={r.customer_type === "enterprise" ? "badge badge-warning badge-sm" : "badge badge-info badge-sm"}>
      {r.customer_type === "enterprise" ? "企业" : "个人"}
    </span>
  );

  const matchBadge = (r: ReviewResponse) => (
    <span className={r.can_match ? "badge badge-success badge-sm" : "badge badge-ghost badge-sm"}>
      {r.can_match ? "是" : "否"}
    </span>
  );

  const riskBg = (level: string | null) => {
    if (!level) return "";
    if (level === "高" || level === "极高" || level === "D") return "bg-red-100 text-red-700";
    if (level === "中" || level === "C") return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-800">📋 审查管理</h2>
        <Link href="/reviews" className="btn btn-outline btn-sm self-start sm:self-auto">
          刷新
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="搜索客户姓名 / 征信状态 / 银行"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input input-bordered input-sm w-full sm:w-64"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="select select-bordered select-sm"
        >
          <option value="">全部</option>
          <option value="matched">已匹配方案</option>
          <option value="unmatched">未匹配</option>
          <option value="highRisk">高风险</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-gray-400 text-sm">暂无审查数据</p>
        </div>
      ) : (
        <>
          {/* Mobile: Card list */}
          <div className="md:hidden space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{r.customer_name}</span>
                  <div className="flex items-center gap-2">
                    {typeBadge(r)}
                    {matchBadge(r)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-gray-400">需求额度</span>
                    <p className="text-gray-700">{r.loan_amount.toLocaleString()} 元</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">征信状态</span>
                    <p className="text-gray-700">{r.credit_status}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">AI 评分</span>
                    <p className="text-gray-700">{r.ai_score ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">风险等级</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${riskBg(r.ai_risk_level)}`}>
                      {r.ai_risk_level ?? "—"}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(r.created_at).toLocaleString("zh-CN")}
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <Link href={`/reviews/${r.id}`} className="btn btn-xs btn-outline flex-1">
                    详情
                  </Link>
                  <button
                    className="btn btn-xs btn-ghost text-red-500 flex-1"
                    onClick={() => handleDelete(r.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block bg-white rounded-xl overflow-hidden shadow-sm">
            <table className="table table-zebra">
              <thead>
                <tr className="text-xs text-gray-500">
                  <th>客户姓名</th>
                  <th>类型</th>
                  <th>需求额度</th>
                  <th>征信状态</th>
                  <th>AI 评分</th>
                  <th>风险等级</th>
                  <th>匹配方案</th>
                  <th>提交时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="text-sm">
                    <td className="font-medium">{r.customer_name}</td>
                    <td>{typeBadge(r)}</td>
                    <td>{r.loan_amount.toLocaleString()} 元</td>
                    <td>{r.credit_status}</td>
                    <td>{r.ai_score ?? "—"}</td>
                    <td>{r.ai_risk_level ?? "—"}</td>
                    <td>{matchBadge(r)}</td>
                    <td className="text-gray-400 text-xs">
                      {new Date(r.created_at).toLocaleString("zh-CN")}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Link href={`/reviews/${r.id}`} className="btn btn-xs btn-outline">
                          详情
                        </Link>
                        <button
                          className="btn btn-xs btn-ghost text-red-500"
                          onClick={() => handleDelete(r.id)}
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                className="btn btn-sm btn-outline"
                disabled={page <= 1}
                onClick={goToPrevPage}
              >
                上一页
              </button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                className="btn btn-sm btn-outline"
                disabled={page >= totalPages}
                onClick={goToNextPage}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}