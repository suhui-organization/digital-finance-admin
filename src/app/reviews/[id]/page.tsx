"use client";

import { login as apiLogin, getReview, type ReviewResponse } from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiLogin("admin", "admin")
      .then(() => getReview(id))
      .then((r) => setReview(r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">审查报告未找到</p>
        <Link href="/reviews" className="btn btn-primary btn-sm mt-4">返回列表</Link>
      </div>
    );
  }

  const riskColor =
    review.ai_risk_level === "低" || review.ai_risk_level === "A" ? "badge badge-success" :
    review.ai_risk_level === "中" || review.ai_risk_level === "B" || review.ai_risk_level === "C" ? "badge badge-warning" :
    review.ai_risk_level === "高" || review.ai_risk_level === "极高" || review.ai_risk_level === "D" ? "badge badge-error" :
    "badge badge-ghost";

  const aiLevel = (score: number) => {
    if (score >= 75) return "A 级 (优秀)";
    if (score >= 55) return "B 级 (良好)";
    if (score >= 35) return "C 级 (一般)";
    return "D 级 (高风险)";
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/reviews" className="btn btn-ghost btn-sm">← 返回列表</Link>
        <h2 className="text-xl font-semibold text-gray-800">审查详情</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic info */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-700 mb-4">基本信息</h3>
          <dl className="space-y-3 text-sm">
            {[
              ["客户姓名", review.customer_name],
              ["性别", review.gender],
              ["年龄", String(review.age)],
              ["婚姻状况", review.marital_status],
              ["需求额度", `${review.loan_amount.toLocaleString()} 元`],
              ["企业客户", review.is_enterprise ? "是" : "否"],
              ["主要银行", review.main_bank],
              ["个人负债总额", `${review.total_debt.toLocaleString()} 元`],
              ["征信状态", review.credit_status],
              ["近1月查询", `${review.credit_query_1m} 次`],
              ["近3月查询", `${review.credit_query_3m} 次`],
              ["近6月查询", `${review.credit_query_6m} 次`],
              ["配偶情况", review.spouse_info],
              ["配偶配合", review.spouse_cooperate ? "是" : "否"],
              ["个人亮点", review.highlights?.join("、") || "无"],
              ["方案匹配", review.can_match ? "可匹配" : "不可匹配"],
              ["到访时间", new Date(review.visit_time).toLocaleString("zh-CN")],
              ["提交时间", new Date(review.created_at).toLocaleString("zh-CN")],
            ].map(([label, value]) => (
              <div key={label} className="flex">
                <dt className="w-24 text-gray-500 flex-shrink-0">{label}</dt>
                <dd className="text-gray-800">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* AI Analysis */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-700 mb-4">AI 智能分析</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  {review.ai_score != null ? Math.round(review.ai_score) : "—"}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">资质评分</p>
                <p className="text-lg font-semibold">
                  {review.ai_score != null ? aiLevel(review.ai_score) : "未评估"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">风险等级</p>
              <span className={riskColor}>{review.ai_risk_level ?? "未评估"}</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">方案匹配</p>
              <span className={review.can_match ? "badge badge-success" : "badge badge-error"}>
                {review.can_match ? "已匹配" : "未匹配"}
              </span>
            </div>
            {review.ai_summary && (
              <div>
                <p className="text-sm text-gray-500 mb-1">AI 摘要</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{review.ai_summary}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debt Details */}
      {review.debt_details && review.debt_details.length > 0 && (
        <div className="mt-6 bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-700 mb-4">负债明细</h3>
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm">
              <thead>
                <tr className="text-xs text-gray-500">
                  <th>机构</th>
                  <th>总额</th>
                  <th>余额</th>
                  <th>贷款方式</th>
                  <th>到期日</th>
                  <th>还款方式</th>
                </tr>
              </thead>
              <tbody>
                {review.debt_details.map((d, i) => (
                  <tr key={d.id || i} className="text-sm">
                    <td className="font-medium">{d.institution}</td>
                    <td>{d.total_amount.toLocaleString()}</td>
                    <td>{d.balance.toLocaleString()}</td>
                    <td>{d.loan_method}</td>
                    <td>{d.loan_due}</td>
                    <td>{d.repayment_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}