import styled from "styled-components";
interface BadgeProps {
  $isAi?: boolean;
}

export const StProjectSection = styled.section`
  background-color: ${({ theme }) => theme.colors.gray50};
  padding: 5rem 0;
  border-top: 1px solid ${({ theme }) => theme.colors.gray100};
`;

export const StSectionInner = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 0 1.5rem;
`;

export const StHeaderGroup = styled.div`
  margin-bottom: 3rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const StSectionTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const StCommonStackWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);

  .label {
    font-size: 0.875rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray600};
    margin-right: 0.25rem;
  }

  .badge-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
`;

export const StCoreBadge = styled.span<BadgeProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid #e5e7eb;
  background-color: #fff;
  color: #4b5563;
  white-space: nowrap;

  ${({ $isAi }) =>
    $isAi &&
    `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: 1px solid transparent;
    font-weight: 700;
    box-shadow: 0 2px 4px rgba(118, 75, 162, 0.3);
  `}
`;
export const StProjectList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3rem;
`;

export const StPhilosophyBox = styled.div`
  margin-top: 24px;
  padding: 20px;
  background-color: rgba(
    0,
    0,
    0,
    0.03
  ); /* 아주 연한 회색 배경 (다크모드면 반대로) */
  border-left: 4px solid #3b82f6; /* 강조용 포인트 컬러 (파란색 계열) */
  border-radius: 8px;

  .catchphrase {
    font-size: 1.1rem;
    font-weight: 700;
    color: #333; /* 제목 색상 */
    margin-bottom: 12px;
    font-style: italic;
    font-family: serif; /* 영문 캐치프레이즈 느낌 살리기 */
  }

  .description {
    font-size: 0.95rem;
    line-height: 1.6;
    color: #555; /* 본문 색상 */

    b {
      color: #111; /* 강조 텍스트 진하게 */
      font-weight: 600;
      background: linear-gradient(
        to top,
        #e0e7ff 40%,
        transparent 40%
      ); /* 형광펜 효과 */
    }
  }

  /* 모바일 대응 */
  @media (max-width: 768px) {
    padding: 16px;
    .description {
      font-size: 0.9rem;
    }
  }
`;
