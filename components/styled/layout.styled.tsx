import styled from "styled-components";
// 공통 레이아웃
export const StContainer = styled.div`
  padding: 2rem 1rem;
`;

export const StWrapper = styled.div`
  min-width: 320px;
  max-width: 540px;
  margin: 0 auto;
  background-color: ${({ theme }) => theme.colors.gray50};
  color: ${({ theme }) => theme.colors.gray900};
  position: relative;
`;

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
