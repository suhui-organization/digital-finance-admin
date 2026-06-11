"use client";

import {
  addPrize as apiAddPrize,
  deletePrize as apiDeletePrize,
  getLotteryActivity,
  updateLotteryActivity,
  type LotteryActivity
} from "@/lib/api";
import { useEffect, useState } from "react";

export default function LotteryConfigPage() {
  const [activity, setActivity] = useState<LotteryActivity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const a = await getLotteryActivity();
        if (!cancelled) setActivity(a);
      } catch {
      // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleActive = async () => {
    if (!activity) return;
    try {
      const updated = await updateLotteryActivity({ is_active: !activity.is_active });
      setActivity(updated);
    } catch {
      alert("操作失败");
    }
  };

  const handleAddPrize = async () => {
    const name = prompt("奖品名称：");
    if (!name) return;
    const probability = parseFloat(prompt("中奖概率 (0-1)：", "0.1") || "0.1");
    const stock = parseInt(prompt("库存数量：", "100") || "100", 10);

    try {
      const prize = await apiAddPrize({
        name,
        probability,
        stock,
        image_url: "",
        is_active: true,
      });
      setActivity((prev) =>
        prev ? { ...prev, prizes: [...prev.prizes, prize] } : prev
      );
    } catch {
      alert("添加失败");
    }
  };

  const handleDeletePrize = async (prizeId: string) => {
    if (!confirm("确定要删除此奖品吗？")) return;
    try {
      await apiDeletePrize(prizeId);
      setActivity((prev) =>
        prev
          ? { ...prev, prizes: prev.prizes.filter((p) => p.id !== prizeId) }
          : prev
      );
    } catch {
      alert("删除失败");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  const prizes = activity?.prizes || [];

  const statusBadge = (isActive: boolean) => (
    <span className={isActive ? "badge badge-success badge-sm" : "badge badge-ghost badge-sm"}>
      {isActive ? "启用" : "禁用"}
    </span>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">🎁 抽奖配置</h2>
      </div>

      {/* Activity toggle */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-700">活动状态</h3>
            <p className="text-xs text-gray-500 mt-1">
              {activity?.is_active ? "用户可参与抽奖" : "抽奖活动已关闭"}
            </p>
          </div>
          <button
            className={`btn btn-sm ${activity?.is_active ? "btn-success" : "btn-outline"}`}
            onClick={toggleActive}
          >
            {activity?.is_active ? "活动中" : "已关闭"}
          </button>
        </div>
      </div>

      {/* Prize list */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-base font-semibold text-gray-700">
            奖品管理 ({prizes.length} 项)
          </h3>
          <button className="btn btn-primary btn-sm" onClick={handleAddPrize}>
            + 添加奖品
          </button>
        </div>

        {prizes.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">暂无奖品配置</p>
        ) : (
          <>
            {/* Mobile: Card list */}
            <div className="md:hidden space-y-3">
              {prizes.map((p) => (
                <div key={p.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{p.name}</span>
                    {statusBadge(p.is_active)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-xs text-gray-400">中奖概率</span>
                      <p className="text-gray-700 font-medium">{(p.probability * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">库存</span>
                      <p className="text-gray-700 font-medium">{p.stock > 0 ? p.stock : "∞"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">占比</span>
                      <progress
                        className="progress progress-primary w-full mt-1"
                        value={p.probability * 100}
                        max={100}
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      className="btn btn-ghost btn-xs text-red-500 w-full"
                      onClick={() => handleDeletePrize(p.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr className="text-xs text-gray-500">
                    <th>奖品名称</th>
                    <th>中奖概率</th>
                    <th>库存</th>
                    <th>中奖率占比</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {prizes.map((p) => (
                    <tr key={p.id} className="text-sm">
                      <td className="font-medium">{p.name}</td>
                      <td>{(p.probability * 100).toFixed(1)}%</td>
                      <td>{p.stock > 0 ? p.stock : "∞"}</td>
                      <td>
                        <progress
                          className="progress progress-primary w-24"
                          value={p.probability * 100}
                          max={100}
                        />
                      </td>
                      <td>{statusBadge(p.is_active)}</td>
                      <td>
                        <button
                          className="btn btn-ghost btn-xs text-red-500"
                          onClick={() => handleDeletePrize(p.id)}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}