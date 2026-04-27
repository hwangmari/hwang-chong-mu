"use client";

import styled from "styled-components";
import { useState } from "react";

interface ShareButtonProps {
  totalAmount: number;
  perPersonShare: number;
  membersCount: number;
  settlements: { from: string; to: string; amount: number }[];
  remainder: number;
  remainderReceiver: string | null;
}

export default function ShareButton({
  totalAmount,
  perPersonShare,
  membersCount,
  settlements,
  remainder,
  remainderReceiver,
}: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    const settlementText = settlements
      .map((s) => `💸 ${s.from} ➔ ${s.to}: ${s.amount.toLocaleString()}원`)
      .join("\n");

    const remainderText =
      remainder > 0 && remainderReceiver
        ? `\n🧮 절사 잔액: ${remainder.toLocaleString()}원 (${remainderReceiver}에게 반영)`
        : "";

    const text = `[황총무 정산 리포트] 🐥\n\n💰 총 지출: ${totalAmount.toLocaleString()}원\n👥 인원: ${membersCount}명\n📢 1인당: ${perPersonShare.toLocaleString()}원${remainderText}\n\n--------------------------\n${settlementText}\n--------------------------\n황총무와 함께 즐거운 정산 완료! ✨`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "황총무 정산", text });
      } else {
        await navigator.clipboard.writeText(text);
        alert("정산 내역이 복사되었습니다! 카톡에 붙여넣어주세요. 💌");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.error("공유 실패:", error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <StShareButton onClick={handleShare} disabled={isSharing}>
      {isSharing ? "공유 준비 중..." : "💬 카톡 공유용 내역 복사하기"}
    </StShareButton>
  );
}

const StShareButton = styled.button`
  width: 100%;
  padding: 1rem;
  background-color: #fee500;
  color: #191919;
  border: none;
  border-radius: 1rem;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
