"use client";

import styled from "styled-components";

export default function FooterTips() {
  return (
    <StFooterContainer>
      {/* 2. 브랜드 스토리 */}
      <StStoryCard>
        <StTitle>🤔 왜 만들었냐구요?</StTitle>
        <StContent>
          <p>
            <b>&quot;이 날 어때?&quot;</b> 하면 철수가 안 되고,
            <br />
            <b>&quot;그럼 이 날은?&quot;</b> 하면 영희가 안 되고...🤦‍♂️
            <br />이 무한 루프가 답답해서 직접 만들었어요!
          </p>
          <StSolutionBox>
            <StSolutionTitle>💡 황총무의 솔루션</StSolutionTitle>
            <p>
              다들 바빠서 &apos;되는 날&apos; 찾기가 너무 힘들죠?
              <br />
              <b>역발상이 필요합니다!</b>
              <br />
              <b>
                &quot;다들 들어와서{" "}
                <StRedHighlight>안 되는 날(❌)</StRedHighlight>만 찍어줘! 남는
                날이 우리가 만날 날이야!&quot;
              </b>
            </p>
          </StSolutionBox>
        </StContent>
      </StStoryCard>

      {/* 3. 실전 꿀팁 */}
      <StTipsCard>
        <StTitle>🍯 약속 잡기 꿀팁</StTitle>

        <StTipList>
          <li className="flex gap-2 items-start">
            <StTipText>
              <b>이럴 때 유용해요!</b>
              <br />
              <span className="desc">
                &quot;이번 달 안에 법카 써야 해! 💳&quot;
                <br />
                기간 내 데드라인이 있는 약속 잡기 딱 좋아요.
              </span>
            </StTipText>
          </li>
          <li className="flex gap-2 items-start">
            <StTipText>
              <b>전원 참석이 힘든가요?</b>
              <br />
              <span className="desc">
                &apos;불참자 최소&apos; 날짜를 골라보세요. 완벽한 날보단
                함께하는 날이 중요하니까요!
              </span>
            </StTipText>
          </li>
        </StTipList>
      </StTipsCard>
    </StFooterContainer>
  );
}


const StFooterContainer = styled.div`
  margin-top: 2rem; /* mt-8 */
  width: 100%;
`;


const StStoryCard = styled.div`
  background-color: ${({ theme }) => theme.colors.gray100}; /* slate-100 대응 */
  padding: 1rem;
  border-radius: 0.75rem; /* rounded-xl */
  border: 1px solid ${({ theme }) => theme.colors.gray200}; /* slate-200 대응 */
`;

const StTitle = styled.h4`
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray800};
  margin-bottom: 0.5rem; /* mb-2 */
  font-size: 0.875rem; /* text-sm */
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const StContent = styled.div`
  font-size: 0.75rem; /* text-xs */
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.625; /* leading-relaxed */
  display: flex;
  flex-direction: column;
  gap: 0.5rem; /* space-y-2 */
`;

const StSolutionBox = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  padding: 0.5rem;
  border-radius: 0.5rem; /* rounded-lg */
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  margin-top: 0.5rem;
`;

const StSolutionTitle = styled.p`
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray700}; /* slate-700 */
  margin-bottom: 0.25rem;
`;

const StRedHighlight = styled.span`
  color: #ef4444; /* red-500 */
  text-decoration: underline;
`;


const StTipsCard = styled.div`
  background-color: #fefce8; /* yellow-50 (테마에 없으면 hex 사용) */
  padding: 1rem;
  border-radius: 0.75rem; /* rounded-xl */
  border: 1px solid #fef9c3; /* yellow-100 */
  margin-top: 1rem;
  margin-bottom: 2.5rem; /* mb-10 */
`;

const StTipList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.75rem; /* space-y-3 */
`;

const StTipText = styled.div`
  font-size: 0.75rem; /* text-xs */
  color: ${({ theme }) => theme.colors.gray700};

  .desc {
    color: ${({ theme }) => theme.colors.gray500};
  }
`;
