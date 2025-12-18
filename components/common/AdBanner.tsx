// components/common/AdBanner.tsx
"use client";

import { useEffect } from "react";

export default function AdBanner() {
  useEffect(() => {
    const pushAd = () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const adsbygoogle = (window as any).adsbygoogle;
        // 광고 단위가 존재하고, 아직 처리되지 않은 ins 태그가 있을 때만 push
        if (adsbygoogle) {
          adsbygoogle.push({});
        }
      } catch (e) {
        // 에러 로그를 굳이 남기지 않거나, 특정 조건에서만 남김
      }
    };

    // 마운트 시 약간의 지연을 주어 DOM이 확실히 로드된 후 실행
    const timer = setTimeout(pushAd, 100);
    return () => clearTimeout(timer);
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
