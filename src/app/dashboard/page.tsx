"use client";

import { login as apiLogin, listReviews, type ReviewResponse } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiLogin("admin", "admin")
      .then(() => setAuthReady(true))
      .then(() => listReviews(1, 100))
      .then((res) => setReviews(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = reviews.length;
  const matched = reviews.filter((r) => r.can_match).length;
  const highRisk = reviews.filter(
    (r) => r.ai_risk_level === "高" || r.ai_risk_level === "极高" || r.ai_risk_level === "D"
  ).length;

  const stats = [
    { label: "审查总数", value: total, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "本月提交", value: total, color: "text-green-600", bg: "bg-green-50" },
    { label: "已匹配方案", value: matched, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "高风险客户", value: highRisk, color: "text-red-600", bg: "bg-red-50" },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      "正常": "badge badge-success",
      "关注": "badge badge-warning",
      "当前逾期": "badge badge-error",
      "呆账": "badge badge-error",
      "代偿": "badge badge-error",
      "法诉": "badge badge-error",
      "其他": "badge badge-ghost",
    };
    return map[status] ?? "badge badge-ghost";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">📊 数据看板</h2>
        {!authReady && (
          <span className="badge badge-warning">未连接到服务器</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-5`}>
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-700 mb-4">最近提交</h3>
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            暂无审查数据，请先在 Mobile 端提交审查报告
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="text-xs text-gray-500">
                  <th>客户姓名</th>
                  <th>征信状态</th>
                  <th>AI 评分</th>
                  <th>风险等级</th>
                  <th>提交时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {reviews.slice(0, 5).map((r) => (
                  <tr key={r.id} className="text-sm">
                    <td className="font-medium">{r.customer_name}</td>
                    <td><span className={statusBadge(r.credit_status)}>{r.credit_status}</span></td>
                    <td>{r.ai_score ?? "—"}</td>
                    <td>{r.ai_risk_level ?? "—"}</td>
                    <td className="text-gray-400">
                      {new Date(r.created_at).toLocaleDateString("zh-CN")}
                    </td>
                    <td>
                      <Link href={`/reviews/${r.id}`} className="btn btn-xs btn-outline btn-primary">
                        查看详情
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}