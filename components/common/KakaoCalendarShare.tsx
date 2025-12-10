"use client";

import React, { useState } from "react";

const ShareButton = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // 2초 뒤 원상복구
    } catch (err) {
      alert("링크 복사에 실패했습니다.");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`mt-4 px-4 py-2 rounded transition font-medium text-sm flex items-center gap-2 ${
        copied
          ? "bg-green-500 text-white"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }`}
    >
      {copied ? <>✅ 복사 완료!</> : <>🔗 약속 링크 복사하기</>}
    </button>
  );
};

export default ShareButton;
