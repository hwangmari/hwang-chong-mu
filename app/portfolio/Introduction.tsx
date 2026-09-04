"use client";

import styled from "styled-components";

interface IntroductionProps {
  /** 첫 화면이 이미 같은 문장을 크게 쓰고 있으면 false로 꺼서 중복을 없앤다 */
  showTitle?: boolean;
}

export default function Introduction({ showTitle = true }: IntroductionProps) {
  return (
    <StIntroSection>
      {/* 메인 카피 영역 */}
      {showTitle && (
        <StTitleWrapper>
          좋은 크루들과 함께할 때, <br />
          <span className="highlight">더 좋은 서비스</span>를 만듭니다.
        </StTitleWrapper>
      )}

      {/* 소개글 영역 */}
      <StDescriptionWrapper id="portfolio-intro-body">
        직접 사용할 수 있는 서비스를 만들 때 가장 큰 성취감을 느낍니다.
        <br />
        IE6 시절부터 쌓아온 크로스브라우징 경험은 어떤 환경에서도{" "}
        <b>견고한 UI를 구현하는 단단한 기반</b>이 되었습니다. 이를 바탕으로
        React, Next.js 등 프론트엔드 기술을 유연하게 다루며 사용성을
        극대화합니다. 견고한 마크업 역량 위에 프론트엔드 기술을 더해,{" "}
        <b>사용자가 느낄 경험의 밀도</b>를 높이는 데 집중합니다.
        <br />
        <br />
        단순 구현을 넘어 <b>기획의 의도와 UX 가치까지 깊이 있게 이해</b>하며
        개발합니다. <br />
        디자인 디테일은 물론 프로젝트의 전체적인 흐름을 파악하고 있어,
        기획자·디자이너와 긴밀히 소통하며{" "}
        <b>팀의 시너지를 이끌어내는 든든한 파트너</b>입니다.
      </StDescriptionWrapper>

    </StIntroSection>
  );
}

const StIntroSection = styled.section`
  max-width: 44rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.85rem;
`;

const StTitleWrapper = styled.div`
  font-size: 3rem;
  line-height: 1.2;
  font-weight: 800;
  .highlight {
    color: ${({ theme }) => theme.colors.blue500};
  }
`;

const StDescriptionWrapper = styled.div`
  font-size: 1rem;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.gray600};
  word-break: keep-all;

  b {
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray900};
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0) 62%,
      ${({ theme }) => theme.colors.amber200} 62%
    );
  }
`;

