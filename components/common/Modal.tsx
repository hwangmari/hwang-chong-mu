"use client";

import { ModalState } from "@/types";
import styled, { keyframes } from "styled-components";

interface Props {
  modal: ModalState;
  onClose: () => void;
  onConfirm: () => void;
}

export default function Modal({ modal, onClose, onConfirm }: Props) {
  if (!modal.isOpen) return null;

  return (
    <StOverlay>
      <StModalContainer>
        <div className="text-center">
          <StIcon>🐰</StIcon>
          <StMessage>{modal.message}</StMessage>

          <StButtonGroup>
            {modal.type === "confirm" && (
              <StCancelButton onClick={onClose}>취소</StCancelButton>
            )}
            <StConfirmButton onClick={onConfirm}>확인</StConfirmButton>
          </StButtonGroup>
        </div>
      </StModalContainer>
    </StOverlay>
  );
}

// ✨ 스타일 정의 (St 프리픽스)

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const popIn = keyframes`
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

const StOverlay = styled.div`
  position: fixed;
  inset: 0; /* top:0, right:0, bottom:0, left:0 */
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem; /* px-4 */
  background-color: rgba(0, 0, 0, 0.4); /* bg-black/40 */
  backdrop-filter: blur(4px); /* backdrop-blur-sm */
  animation: ${fadeIn} 0.2s ease-out;
`;

const StModalContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  width: 100%;
  max-width: 20rem; /* max-w-xs (320px) */
  padding: 1.5rem; /* p-6 */
  border-radius: 2rem; /* rounded-[2rem] */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); /* shadow-2xl */
  animation: ${popIn} 0.3s cubic-bezier(0.16, 1, 0.3, 1); /* 부드러운 팝업 효과 */

  @media ${({ theme }) => theme.media.desktop} {
    max-width: 24rem; /* sm:max-w-sm (384px) */
  }
`;

const StIcon = styled.div`
  font-size: 2.25rem; /* text-4xl */
  margin-bottom: 1rem; /* mb-4 */
`;

const StMessage = styled.h3`
  font-size: 1.125rem; /* text-lg */
  font-weight: 800; /* font-extrabold */
  color: ${({ theme }) => theme.colors.gray900};
  white-space: pre-line;
  margin-bottom: 0.5rem; /* mb-2 */
  line-height: 1.625; /* leading-relaxed */
`;

const StButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem; /* gap-3 */
  margin-top: 1.5rem; /* mt-6 */
`;

const StButtonBase = styled.button`
  flex: 1;
  padding: 0.75rem 0; /* py-3 */
  font-weight: 700;
  border-radius: 0.75rem; /* rounded-xl */
  transition: all 0.2s;
`;

const StCancelButton = styled(StButtonBase)`
  background-color: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray600};

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray200};
  }
`;

const StConfirmButton = styled(StButtonBase)`
  background-color: ${({ theme }) => theme.colors.gray900};
  color: ${({ theme }) => theme.colors.white};
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); /* shadow-lg */

  &:hover {
    background-color: ${({ theme }) => theme.colors.black};
  }
`;
