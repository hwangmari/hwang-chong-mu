import styled from "styled-components";
// 공통 레이아웃
export const StContainer = styled.div`
  padding: 2rem 1rem;
`;

/** 공통 max width 520 */
export const StWrapper = styled.div`
  min-width: 320px;
  width: 100%;
  max-width: ${({ theme }) => theme.layout.narrowWidth};
  margin: 0 auto;
  background-color: ${({ theme }) => theme.colors.gray50};
  color: ${({ theme }) => theme.colors.gray900};
  position: relative;
`;

/** 웨이팅 박스 */
export const StWaitingBox = styled.div`
  max-width: ${({ theme }) => theme.layout.narrowWidth};
  height: 200px;
  display: flex;
  margin: 0 auto;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 12px;
  color: #aaa;
  border: 2px dashed #e9ecef;
`;

/** 박스라인 */
export const StSection = styled.div`
  background: ${({ theme }) => theme.colors.white};
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 20px;
  }
`;

/** PC 반응형 flex박스 */
export const StFlexBox = styled.div`
  max-width: 540px;
  margin: 0 auto;
  @media ${({ theme }) => theme.media.desktop} {
    display: flex;
    max-width: 1024px;
    gap: 40px;
    & > div {
      flex: 1;
    }
    .flex-rgt-box {
    }
  }
`;
