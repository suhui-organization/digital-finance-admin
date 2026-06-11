"use client";

import { createAdminQrCode, getCachedUser, listAdminQrCodes, updateAdminQrCodeStatus, type AdminQrCodeRecord } from "@/lib/api";
import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";

const DEFAULT_TARGET_URL =
  process.env.NEXT_PUBLIC_QR_TARGET_URL || "http://localhost:16020";
const DEFAULT_ACCESS_BASE_URL =
  process.env.NEXT_PUBLIC_QR_ACCESS_BASE_URL || "http://localhost:16080";
const MAX_HISTORY_SIZE = 8;

const TARGET_TEMPLATES = [
  { id: "mobile-home", label: "移动端首页", url: DEFAULT_TARGET_URL },
  { id: "mobile-lottery", label: "移动端抽奖页", url: `${DEFAULT_TARGET_URL.replace(/\/$/, "")}/lottery` },
  { id: "manual", label: "手动输入", url: "" },
];

const canManageQrCode = (role: string) =>
  role === "admin" || role === "super_admin";

const deriveAccessBaseUrl = (accessUrl: string) => {
  try {
    const parsed = new URL(accessUrl);
    const suffix = /^\/api\/v1\/qrcodes\/[^/]+\/visit$/;
    if (suffix.test(parsed.pathname)) {
      return `${parsed.origin}`;
    }
    return `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}`;
  } catch {
    return DEFAULT_ACCESS_BASE_URL;
  }
};

const buildFinalUrl = ({
  targetUrl,
  channel,
  campaign,
  note,
}: {
  targetUrl: string;
  channel: string;
  campaign: string;
  note: string;
}) => {
  const trimmedUrl = targetUrl.trim();
  if (!trimmedUrl) {
    throw new Error("请先填写目标地址");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    throw new Error("目标地址不是有效的绝对 URL");
  }

  if (channel.trim()) parsedUrl.searchParams.set("channel", channel.trim());
  if (campaign.trim()) parsedUrl.searchParams.set("campaign", campaign.trim());
  if (note.trim()) parsedUrl.searchParams.set("note", note.trim());

  return parsedUrl.toString();
};

export default function QrCodePage() {
  const user = useMemo(() => getCachedUser(), []);

  const [selectedTemplateId, setSelectedTemplateId] = useState(TARGET_TEMPLATES[0].id);
  const [targetUrl, setTargetUrl] = useState(DEFAULT_TARGET_URL);
  const [accessBaseUrl, setAccessBaseUrl] = useState(DEFAULT_ACCESS_BASE_URL);
  const [channel, setChannel] = useState("");
  const [campaign, setCampaign] = useState("");
  const [note, setNote] = useState("");
  const [history, setHistory] = useState<AdminQrCodeRecord[]>([]);

  const [finalUrl, setFinalUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await listAdminQrCodes({ page: 1, pageSize: MAX_HISTORY_SIZE });
      setHistory(res.data);
    } catch {
      setFeedback({ type: "error", message: "加载二维码历史失败" });
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  if (!user || !canManageQrCode(user.role)) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800">二维码中心</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          只有管理员可以创建二维码。你可以联系 super_admin 或 admin 申请权限。
        </p>
      </div>
    );
  }

  const handleGenerate = async () => {
    setFeedback(null);
    setSubmitting(true);
    try {
      const nextUrl = buildFinalUrl({ targetUrl, channel, campaign, note });
      const record = await createAdminQrCode({
        target_url: targetUrl,
        channel,
        campaign,
        note,
        access_base_url: accessBaseUrl,
      });
      const accessUrl = record.access_url || record.final_url || nextUrl;
      const dataUrl = await QRCode.toDataURL(accessUrl, {
        width: 420,
        margin: 2,
        color: {
          dark: "#0b1f3a",
          light: "#ffffff",
        },
      });
      setFinalUrl(accessUrl);
      setQrDataUrl(dataUrl);
      await loadHistory();
      setFeedback({ type: "success", message: "二维码已生成，可复制链接或下载 PNG" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "生成二维码失败，请稍后再试";
      setFeedback({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!finalUrl) return;
    try {
      await navigator.clipboard.writeText(finalUrl);
      setFeedback({ type: "success", message: "链接已复制到剪贴板" });
    } catch {
      setFeedback({ type: "error", message: "复制失败，请手动复制链接" });
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `digital-finance-qrcode-${Date.now()}.png`;
    link.click();
  };

  const handleReset = () => {
    setSelectedTemplateId(TARGET_TEMPLATES[0].id);
    setTargetUrl(DEFAULT_TARGET_URL);
    setAccessBaseUrl(DEFAULT_ACCESS_BASE_URL);
    setChannel("");
    setCampaign("");
    setNote("");
    setFinalUrl("");
    setQrDataUrl("");
    setFeedback(null);
  };

  const applyHistoryItem = async (item: AdminQrCodeRecord) => {
    setSelectedTemplateId("manual");
    setTargetUrl(item.target_url);
    if (item.access_url) {
      setAccessBaseUrl(deriveAccessBaseUrl(item.access_url));
    }
    setChannel(item.channel);
    setCampaign(item.campaign);
    setNote(item.note);

    try {
      const accessUrl = item.access_url || item.final_url;
      const dataUrl = await QRCode.toDataURL(accessUrl, {
        width: 420,
        margin: 2,
        color: {
          dark: "#0b1f3a",
          light: "#ffffff",
        },
      });
      setFinalUrl(accessUrl);
      setQrDataUrl(dataUrl);
      setFeedback({ type: "success", message: "已回填历史配置" });
    } catch {
      setFeedback({ type: "error", message: "历史记录回填失败，请重新生成" });
    }
  };

  const handleDisable = async (id: string) => {
    try {
      await updateAdminQrCodeStatus(id, "disabled");
      await loadHistory();
      setFeedback({ type: "success", message: "二维码记录已停用" });
    } catch {
      setFeedback({ type: "error", message: "停用失败，请稍后重试" });
    }
  };

  const copyHistoryUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setFeedback({ type: "success", message: "历史链接已复制到剪贴板" });
    } catch {
      setFeedback({ type: "error", message: "复制失败，请手动复制" });
    }
  };

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-blue-200/70 bg-[linear-gradient(130deg,#0f2e57_0%,#1e4f85_60%,#2f6cb0_100%)] p-6 text-white shadow-lg sm:p-8">
        <div className="absolute right-0 top-0 h-36 w-36 translate-x-10 -translate-y-10 rounded-full bg-white/15 blur-2xl" />
        <p className="text-xs font-medium tracking-[0.12em] text-blue-100">ADMIN TOOLING</p>
        <h1 className="mt-2 text-2xl font-semibold text-balance sm:text-3xl">二维码中心</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50">
          为活动或入口页快速生成程序访问二维码。扫码用户将进入固定落地页，你可以按渠道和活动打上参数。
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-slate-800">创建配置</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            请输入固定落地地址，可选附加渠道和活动参数，生成后即可用于海报或线下物料投放。
          </p>

          <div className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">落地页模板</span>
              <select
                value={selectedTemplateId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setSelectedTemplateId(nextId);
                  const matched = TARGET_TEMPLATES.find((item) => item.id === nextId);
                  if (matched && matched.url) {
                    setTargetUrl(matched.url);
                  }
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {TARGET_TEMPLATES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">目标地址</span>
              <input
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com/app"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">访问 URL 基址</span>
              <input
                value={accessBaseUrl}
                onChange={(e) => setAccessBaseUrl(e.target.value)}
                placeholder="https://api.example.com"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">渠道标识</span>
                <input
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  placeholder="wechat_group"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">活动名称</span>
                <input
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  placeholder="summer_lottery"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">备注</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="offline-booth-a"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleGenerate}
              disabled={submitting}
              className="rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#163150] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "生成中..." : "生成二维码"}
            </button>
            <button
              onClick={handleReset}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              重置
            </button>
          </div>

          {feedback && (
            <p
              className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {feedback.message}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-slate-800">预览与导出</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            先确认链接，再执行复制或下载。下载文件为 PNG，可直接用于海报或社群传播。
          </p>

          {!qrDataUrl ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-12 text-center">
              <p className="text-sm text-slate-500">二维码尚未生成，完成左侧配置后点击“生成二维码”。</p>
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">最终链接</p>
                <p className="mt-1 break-all text-sm text-slate-700">{finalUrl}</p>
              </div>

              <div className="mt-4 flex justify-center rounded-2xl border border-slate-200 bg-white p-4">
                <Image
                  src={qrDataUrl}
                  alt="程序访问二维码"
                  width={224}
                  height={224}
                  className="h-56 w-56 rounded-md"
                  unoptimized
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={handleCopy}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  复制链接
                </button>
                <button
                  onClick={handleDownload}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  下载 PNG
                </button>
              </div>
            </>
          )}

          <div className="mt-6 border-t border-slate-200 pt-5">
            <h3 className="text-sm font-semibold text-slate-700">最近生成</h3>
            {historyLoading ? (
              <p className="mt-2 text-xs text-slate-500">正在加载历史记录...</p>
            ) : history.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">暂无历史记录，生成后会自动保存到后台记录。</p>
            ) : (
              <div className="mt-3 space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <p className="truncate text-xs text-slate-700">{item.access_url || item.final_url}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {new Date(item.created_at).toLocaleString("zh-CN")}
                    </p>
                    <p className={`mt-1 text-[11px] ${item.status === "active" ? "text-emerald-600" : "text-slate-500"}`}>
                      状态：{item.status === "active" ? "启用" : "停用"}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => void applyHistoryItem(item)}
                        className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-white transition hover:bg-slate-900"
                      >
                        回填
                      </button>
                      <button
                        onClick={() => void copyHistoryUrl(item.access_url || item.final_url)}
                        className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-700 transition hover:bg-white"
                      >
                        复制
                      </button>
                      {item.status === "active" && (
                        <button
                          onClick={() => void handleDisable(item.id)}
                          className="rounded-lg border border-rose-300 px-2.5 py-1 text-xs text-rose-700 transition hover:bg-rose-50"
                        >
                          停用
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}