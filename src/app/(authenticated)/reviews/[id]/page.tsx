"use client";

import { getReview, type ReviewResponse } from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReview(id)
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
      <div className="text-center py-20 text-gray-400">
        <p>审查记录不存在或无权访问</p>
        <Link href="/reviews" className="btn btn-primary btn-sm mt-4">
          返回列表
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/reviews" className="btn btn-outline btn-sm mb-4">
        ← 返回列表
      </Link>

      <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">
          审查详情 — {review.customer_name}
        </h2>

        {/* Basic info */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <InfoBlock label="客户类型" value={review.customer_type === "enterprise" ? "企业客户" : "个人客户"} />
          <InfoBlock label="性别" value={review.gender} />
          <InfoBlock label="年龄" value={`${review.age} 岁`} />
          <InfoBlock label="婚姻状况" value={review.marital_status} />
          <InfoBlock label="需求额度" value={`${review.loan_amount.toLocaleString()} 元`} />
          <InfoBlock label="到访时间" value={new Date(review.visit_time).toLocaleString("zh-CN")} />
        </div>
        <hr className="border-gray-100" />

        {/* Individual / Enterprise profile */}
        {review.customer_type === "enterprise" ? (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-700">企业信息</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <InfoBlock label="企业名称" value={review.enterprise_name || "-"} />
              <InfoBlock label="统一社会信用代码" value={review.unified_social_credit_code || "-"} />
              <InfoBlock label="成立年限" value={review.enterprise_years ? `${review.enterprise_years} 年` : "-"} />
              <InfoBlock label="主营业务" value={review.main_business || "-"} />
              <InfoBlock label="月均流水" value={review.monthly_revenue ? `${review.monthly_revenue.toLocaleString()} 元` : "-"} />
              <InfoBlock label="法人配合度" value={review.controller_cooperate ? "配合" : "不配合"} />
            </div>
            {review.enterprise_highlights && review.enterprise_highlights.length > 0 && (
              <div>
                <span className="text-xs text-gray-500">企业亮点：</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(review.enterprise_highlights as string[]).map((h) => (
                    <span key={h} className="badge badge-primary badge-sm">{h}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-700">个人信息</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoBlock label="主要银行" value={review.main_bank} />
              <InfoBlock label="配偶配合" value={review.spouse_cooperate ? "配合" : "不配合"} />
            </div>
              <InfoBlock label="配偶情况" value={review.spouse_info} />
            <div>
                <span className="text-xs text-gray-500">个人亮点：</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {review.highlights.map((h) => (
                    <span key={h} className="badge badge-primary badge-sm">{h}</span>
                  ))}
                </div>
              </div>
          </div>
        )}

        <hr className="border-gray-100" />

        {/* Credit */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-gray-700">征信信息</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <InfoBlock label="征信状态" value={review.credit_status} />
            <InfoBlock label="近1月查询" value={`${review.credit_query_1m} 次`} />
            <InfoBlock label="近3月查询" value={`${review.credit_query_3m} 次`} />
            <InfoBlock label="近6月查询" value={`${review.credit_query_6m} 次`} />
          </div>
        </div>

        {/* Debt */}
        {review.debt_details && review.debt_details.length > 0 && (
          <>
            <hr className="border-gray-100" />
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-700">
                负债明细（总额：{review.total_debt.toLocaleString()} 元）
              </h3>
              <table className="table table-sm table-zebra">
                <thead>
                  <tr className="text-xs text-gray-500">
                    <th>贷款机构</th>
                    <th>贷款总额</th>
                    <th>余额</th>
                    <th>贷款方式</th>
                    <th>贷款期至</th>
                    <th>还款方式</th>
                  </tr>
                </thead>
                <tbody>
                  {review.debt_details.map((d, i) => (
                    <tr key={d.id || i} className="text-sm">
                      <td>{d.institution}</td>
                      <td>{d.total_amount?.toLocaleString()}</td>
                      <td>{d.balance?.toLocaleString()}</td>
                      <td>{d.loan_method}</td>
                      <td>{d.loan_due}</td>
                      <td>{d.repayment_method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* AI Analysis */}
        <hr className="border-gray-100" />
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-gray-700">AI 分析</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoBlock label="AI 评分" value={review.ai_score?.toString() ?? "待评估"} />
            <InfoBlock label="风险等级" value={review.ai_risk_level ?? "待评估"} />
          </div>
          {review.ai_summary && (
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
              {review.ai_summary}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value || "-"}</p>
    </div>
  );
}