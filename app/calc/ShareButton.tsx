"use client";

import styled from "styled-components";

interface ShareButtonProps {
  totalAmount: number;
  perPersonShare: number;
  membersCount: number;
  settlements: { from: string; to: string; amount: number }[];
}

export default function ShareButton({
  totalAmount,
  perPersonShare,
  membersCount,
  settlements,
}: ShareButtonProps) {
  const handleShare = () => {
    const settlementText = settlements
      .map((s) => `💸 ${s.from} ➔ ${s.to}: ${s.amount.toLocaleString()}원`)
      .join("\n");

    const text = `[황총무 정산 리포트] 🐥\n\n💰 총 지출: ${totalAmount.toLocaleString()}원\n👥 인원: ${membersCount}명\n📢 1인당: ${perPersonShare.toLocaleString()}원\n\n--------------------------\n${settlementText}\n--------------------------\n황총무와 함께 즐거운 정산 완료! ✨`;

    if (navigator.share) {
      navigator.share({ title: "황총무 정산", text });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        alert("정산 내역이 복사되었습니다! 카톡에 붙여넣어주세요. 💌");
      });
    }
  };

  return (
    <StShareButton onClick={handleShare}>
      💬 카톡 공유용 내역 복사하기
    </StShareButton>
  );
}

const StShareButton = styled.button`
  width: 100%;
  padding: 1rem;
  background-color: #fee500;
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
`;
