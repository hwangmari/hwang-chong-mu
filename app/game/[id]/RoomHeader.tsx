"use client";
import styled from "styled-components";

interface Props {
  title: string;
}

export default function RoomHeader({ title }: Props) {
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("방 링크가 복사되었습니다!");
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
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;
const StRoomTitle = styled.h1`
  font-size: 1.4rem;
  font-weight: 900;
  color: #333;
  flex: 1;
  word-break: break-all;
  margin-right: 1rem;
`;
const StShareButton = styled.button`
  background: #f1f3f5;
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
