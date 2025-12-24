import styled from "styled-components";
// 공통 레이아웃
export const StContainer = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.gray50};
  padding: 2rem 1rem;
  overflow-x: hidden;
  font-family: ui-sans-serif, system-ui, sans-serif;
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
  width: 100%;
  background: white;
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
`;
