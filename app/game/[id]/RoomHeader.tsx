"use client";
import styled from "styled-components";
import { useModal } from "@/components/common/ModalProvider";

interface Props {
  title: string;
}

export default function RoomHeader({ title }: Props) {
  const { openAlert } = useModal();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      await openAlert("방 링크가 복사되었습니다!");
    } catch (err) {
      console.error("클립보드 복사 실패:", err);
      await openAlert("링크 복사에 실패했습니다. 주소를 직접 복사해주세요!");
    }
  };

  return (
    <StBoardHeader>
      <StRoomTitle>{title || "게임방"}</StRoomTitle>
      <StShareButton onClick={copyLink}>🔗 링크 복사</StShareButton>
    </StBoardHeader>
  );
}

const StBoardHeader = styled.div`
  padding: 1.5rem 1.5rem 0.5rem;
  background: ${({ theme }) => theme.colors.white};
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;
const StRoomTitle = styled.h1`
  font-size: 1.4rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray800};
  flex: 1;
  word-break: break-all;
  margin-right: 1rem;
`;
const StShareButton = styled.button`
  background: ${({ theme }) => theme.colors.gray100};
  color: #495057;
  border: none;
  padding: 0.5rem 0.8rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  font-size: 0.8rem;
  flex-shrink: 0;
  white-space: nowrap;
`;
