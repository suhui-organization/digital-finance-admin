"use client";

import { useEffect } from "react";

export default function AuthenticatedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin authenticated route error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">页面加载异常</h2>
      <p className="text-sm text-gray-500 mb-4">
        {error.message || "发生了未知错误，请稍后重试"}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#162d4a] transition-colors"
      >
        重新加载
      </button>
    </div>
  );
}