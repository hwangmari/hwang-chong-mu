"use client";

import styled, { keyframes, css } from "styled-components";

export const GuideModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <StOverlay>
      <StContainer>
        {/* 닫기 버튼 */}
        <StCloseButton onClick={onClose}>✕</StCloseButton>

        {/* 헤더 */}
        <StHeader>
          <div className="icon">🐰</div>
          <StTitle>어떻게 쓰나요?</StTitle>
        </StHeader>

        {/* 스크롤 가능한 컨텐츠 영역 */}
        <StScrollContent>
          {/* 사용법 */}
          <StSection>
            <p className="mb-2">
              <StStepBadge $color="blue">Step 1</StStepBadge>
              본인의 <b>이름</b>을 입력해주세요.
            </p>
            <p>
              <StStepBadge $color="red">Step 2</StStepBadge>
              달력에서 <StRedUnderline>참석 불가능한 날짜</StRedUnderline>를
              눌러주세요! (빨간색 = 못 가는 날 🙅‍♂️)
            </p>
          </StSection>

          {/* 꿀팁 섹션 */}
          <StTipSection>
            <span className="tip-label">💡 꿀팁</span>
            <p className="tip-text">
              혹시 <b>되는 날이 거의 없다면?</b>
              <br />
              캘린더 위의 <StSmallBadge>다 안돼요</StSmallBadge> 버튼을 누르고,{" "}
              <br />
              <b>되는 날만 다시 눌러서</b> 해제하세요!
            </p>
          </StTipSection>

          {/* Q&A 섹션 */}
          <StQnASection>
            <StSectionTitle>🙋‍♀️ 자주 묻는 질문</StSectionTitle>

            <StCardList>
              <StQnACard>
                <p className="question">Q. 투표 마감은 누가 해요?</p>
                <p className="answer">
                  방장 권한이 따로 없어서{" "}
                  <b className="text-blue">참여자 누구나</b> 할 수 있어요!
                  친구들과 상의가 끝났다면 과감하게 눌러주세요.
                </p>
              </StQnACard>

              <StQnACard>
                <p className="question">Q. 다른 사람 것도 수정돼요?</p>
                <p className="answer">
                  네! 친구의 <b className="text-blue">일정을 대신 수정</b>
                  해주거나 <b className="text-red">삭제</b>할 수 있어요. (단,
                  이름 수정은 안 되니{" "}
                  <b className="underline">삭제 후 다시 등록</b>
                  해주세요! 🙅‍♂️)
                </p>
              </StQnACard>
            </StCardList>
          </StQnASection>
        </StScrollContent>

        {/* 하단 버튼 */}
        <StConfirmButton onClick={onClose}>이해했어요! 👌</StConfirmButton>
      </StContainer>
    </StOverlay>
  );
};

// ✨ 스타일 정의 (St 프리픽스)

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const StOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
  background-color: rgba(0, 0, 0, 0.6); /* bg-black/60 */
  backdrop-filter: blur(4px);
  animation: ${fadeIn} 0.2s ease-out;
`;

const StContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 2rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 24rem; /* max-w-sm */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh; /* 화면 꽉 차지 않게 */
  animation: ${slideUp} 0.3s ease-out;
`;

const StCloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  color: ${({ theme }) => theme.colors.gray300};
  padding: 0.5rem;
  z-index: 10;
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.gray600};
  }
`;

const StHeader = styled.div`
  text-align: center;
  margin-top: 0.5rem;
  flex-shrink: 0;

  .icon {
    font-size: 3rem; /* text-5xl */
    margin-bottom: 0.5rem;
  }
`;

const StTitle = styled.h3`
  font-size: 1.25rem; /* text-xl */
  font-weight: 800; /* font-extrabold */
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.5rem;
`;

// === Scroll Content ===

const StScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  text-align: left;
  background-color: ${({ theme }) => theme.colors.gray50};
  padding: 1.25rem;
  border-radius: 1rem;
  color: ${({ theme }) => theme.colors.gray600};
  font-size: 0.875rem; /* text-sm */
  line-height: 1.625;
  margin-bottom: 1rem;

  /* 스크롤바 숨기기 */
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
`;

const StSection = styled.div`
  margin-bottom: 1rem;
  p {
    margin-bottom: 0.5rem;
  }
`;

const StStepBadge = styled.span<{ $color: "blue" | "red" }>`
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem; /* text-xs */
  font-weight: 700;
  margin-right: 0.25rem;

  ${({ $color }) =>
    $color === "blue"
      ? css`
          background-color: #dbeafe; /* blue-100 */
          color: #2563eb; /* blue-600 */
        `
      : css`
          background-color: #fee2e2; /* red-100 */
          color: #ef4444; /* red-500 */
        `}
`;

const StRedUnderline = styled.b`
  color: #ef4444; /* red-500 */
  text-decoration: underline;
  text-decoration-color: #fecaca; /* red-200 */
  text-decoration-thickness: 4px;
`;

const StTipSection = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray200};
  padding-top: 0.75rem;
  margin-bottom: 0.5rem;

  .tip-label {
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray800};
    font-size: 0.75rem;
  }

  .tip-text {
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.gray500};
    margin-top: 0.25rem;
  }
`;

const StSmallBadge = styled.span`
  background-color: #fee2e2; /* red-100 */
  color: #ef4444; /* red-500 */
  padding: 0 0.25rem;
  border-radius: 0.25rem;
  font-weight: 700;
  font-size: 0.625rem; /* 10px */
`;

// === Q&A Section ===

const StQnASection = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray200};
  padding-top: 1rem;
  margin-top: 0.5rem;
`;

const StSectionTitle = styled.h4`
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
`;

const StCardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const StQnACard = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  .question {
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray800};
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
  }

  .answer {
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.gray500};
  }

  .text-blue {
    color: #3b82f6; /* blue-500 */
  }
  .text-red {
    color: #ef4444; /* red-500 */
  }
  .underline {
    text-decoration: underline;
  }
`;

// === Button ===

const StConfirmButton = styled.button`
  width: 100%;
  padding: 0.875rem 0; /* py-3.5 */
  background-color: ${({ theme }) => theme.colors.gray900};
  color: ${({ theme }) => theme.colors.white};
  font-weight: 700;
  border-radius: 1rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.black};
  }
`;
