import styled from "styled-components";

export const StPage = styled.main`
  overscroll-behavior: none;
  min-height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
`;

export const StShareConfirmBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: 1.2rem;
  background: rgba(24, 25, 26, 0.34);
`;

export const StShareConfirmCard = styled.section`
  width: min(100%, 25rem);
  border-radius: 24px;
  border: 1px solid #e1e2e4;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 24px 60px rgba(24, 25, 26, 0.18);
  padding: 1.25rem;
`;

export const StShareConfirmEyebrow = styled.p`
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #8e9298;
`;

export const StShareConfirmTitle = styled.h3`
  margin-top: 0.35rem;
  font-size: 1.28rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray800};
`;

export const StShareConfirmDescription = styled.p`
  margin-top: 0.55rem;
  font-size: 0.92rem;
  line-height: 1.6;
  color: #305596;
`;

export const StShareConfirmActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  margin-top: 1rem;
`;

export const StShareGhostButton = styled.button`
  border: 1px solid #e1e2e4;
  background: ${({ theme }) => theme.colors.gray100};
  color: #305596;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-size: 0.88rem;
  font-weight: 800;
`;

export const StSharePrimaryButton = styled.button`
  border: none;
  background: #888c94;
  color: ${({ theme }) => theme.colors.white};
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-size: 0.88rem;
  font-weight: 900;
  box-shadow: 0 12px 28px rgba(151, 155, 161, 0.24);
`;

export const StContentWrap = styled.div`
  padding: 1rem;
  display: grid;
  grid-template-rows: auto auto auto auto;
  gap: 0.8rem;

  @media (max-width: 1080px) {
    display: flex;
    flex-direction: column;
  }
`;

// 헤더 우측: 주식 바로가기 + 뷰 탭
export const StHeaderRightSlot = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: flex-end;

  @media (max-width: 767px) {
    width: 100%;
    gap: 0.7rem;
  }
`;

// 모바일에서 뷰 탭이 남은 폭을 채우도록
export const StTabsFill = styled.div`
  @media (max-width: 767px) {
    flex: 1;
    min-width: 0;
  }
`;

// 뷰 탭(아이콘+텍스트)과 같은 스타일. 주식은 이동 링크라 활성 상태 없음(회색 → hover 파랑).
export const StStockShortcut = styled.button`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.gray400};
  padding: 0.3rem 0.1rem;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.16s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.blue600};
  }
`;

export const StStockIcon = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 1.25rem;
  color: inherit;
`;

export const StStockLabel = styled.span``;

// 투자 계좌가 여러 개일 때 뜨는 드롭다운
export const StStockMenuWrap = styled.div`
  position: relative;
  flex-shrink: 0;
`;

export const StStockMenuOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 150;
`;

export const StStockMenu = styled.div`
  position: absolute;
  top: calc(100% + 0.4rem);
  right: 0;
  z-index: 160;
  min-width: 11rem;
  max-height: 60vh;
  overflow-y: auto;
  padding: 0.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.9rem;
  box-shadow: 0 16px 32px -12px rgba(23, 43, 77, 0.28);
`;

export const StStockMenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  width: 100%;
  border: none;
  background: transparent;
  border-radius: 0.6rem;
  padding: 0.6rem 0.7rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray800};
  text-align: left;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.colors.gray100};
    color: ${({ theme }) => theme.colors.blue600};
  }
`;
