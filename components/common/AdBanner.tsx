"use client";

import { useEffect } from "react";
import styled from "styled-components";

export default function AdBanner() {
  useEffect(() => {
    const pushAd = () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const adsbygoogle = (window as any).adsbygoogle;
        if (adsbygoogle) {
          adsbygoogle.push({});
        }
      } catch (e) {
      }
    };

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


const StAdContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1.5rem 0; /* my-6 */
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.gray50};
  color: ${({ theme }) => theme.colors.gray300};
  font-size: 0.75rem; /* text-xs */

  text-align: center;
`;
