"use client";

import { useEffect } from "react";
import styled from "styled-components";

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
        // 에러 로그 생략
      }
    };

    // 마운트 시 약간의 지연을 주어 DOM이 확실히 로드된 후 실행
    const timer = setTimeout(pushAd, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <StAdContainer>
      {/* 구글 애드센스 스크립트가 이 ins 태그 안에 광고를 삽입합니다 */}
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client="ca-pub-9383832812082051"
        data-ad-slot="5643682608"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </StAdContainer>
  );
}

// ✨ 스타일 정의 (St 프리픽스)

const StAdContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1.5rem 0; /* my-6 */
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.gray50};
  color: ${({ theme }) => theme.colors.gray300};
  font-size: 0.75rem; /* text-xs */

  /* 광고가 로드되기 전이나 에러 시 보여줄 스타일 */
  text-align: center;
`;
