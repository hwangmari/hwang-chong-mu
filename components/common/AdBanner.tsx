"use client";

import { useEffect } from "react";

export default function AdBanner() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error(err);
    }
  }, []);

  return (
    // 👇 애드센스에서 [광고 단위 기준] -> [디스플레이 광고] 만들고 받은 코드를 넣으세요.
    <div className="w-full flex justify-center my-4 overflow-hidden">
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", maxWidth: "320px" }} // 모바일 최적화 사이즈
        data-ad-client="ca-pub-본인의_애드센스_ID"
        data-ad-slot="본인의_광고_슬롯_ID"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
