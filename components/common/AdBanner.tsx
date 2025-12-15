// components/common/AdBanner.tsx
"use client";

import { useEffect } from "react";

export default function AdBanner() {
  useEffect(() => {
    try {
      // 광고 스크립트 푸시 (에러 방지용 try-catch)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense Error:", err);
    }
  }, []);

  return (
    // 광고 영역 wrapper (가운데 정렬 & 넘침 방지)
    <div className="w-full flex justify-center my-6 overflow-hidden bg-gray-50 min-h-[100px] items-center text-gray-300 text-xs">
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client="ca-pub-9383832812082051"
        data-ad-slot="5643682608"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
