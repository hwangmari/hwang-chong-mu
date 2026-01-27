import styled from "styled-components";

export const StImageSection = styled.div`
  margin-top: 1.5rem;
  width: 100%;
`;

export const StToggleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background-color: ${({ theme }) => theme.colors.gray50};
  border: 1px dashed ${({ theme }) => theme.colors.gray300};
  border-radius: 0.75rem;
  color: ${({ theme }) => theme.colors.gray600};
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray100};
    color: ${({ theme }) => theme.colors.gray800};
    border-color: ${({ theme }) => theme.colors.gray400};
  }
`;

export const StImageGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-top: 1.5rem;
  animation: slideDown 0.3s ease-out;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const StImageFrame = styled.div`
  position: relative;
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  background-color: ${({ theme }) => theme.colors.gray50};

  /* 이미지 비율 유지를 위한 스타일 */
  display: flex;
  justify-content: center;
  align-items: center;

  /* 특정 클래스가 들어오면 스타일 변경 (예: 모바일 스크린샷) */
  &.mobile-frame {
    max-width: 320px;
    margin: 0 auto;
  }
`;
