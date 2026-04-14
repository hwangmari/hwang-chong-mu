"use client";
import styled from "styled-components";

const GAME_TYPES = [
  {
    id: "telepathy",
    name: "텔레파시",
    emoji: "🔮",
    desc: "찌찌뽕! 우리 얼마나 잘 통할까?",
  },
  {
    id: "clicker",
    name: "광클 대전",
    emoji: "🔥",
    desc: "누가 제일 손가락이 빠를까?",
  },
  {
    id: "wheel",
    name: "복불복 돌림판",
    emoji: "🎡",
    desc: "오늘의 벌칙 당첨자는 누구?",
  },
  {
    id: "ladder",
    name: "사다리 타기",
    emoji: "🪜",
    desc: "운명의 사다리를 타보자!",
  },
];

interface Props {
  isHost: boolean;
  selectedGame: string;
  onSelectGame: (id: string) => void;
}

export default function GameSelector({
  isHost,
  selectedGame,
  onSelectGame,
}: Props) {
  return (
    <StGameSection>
      <StLabel>👇 오늘의 게임</StLabel>
      {isHost ? (
        <StGameGrid>
          {GAME_TYPES.map((g) => (
            <StGameCard
              key={g.id}
              $active={selectedGame === g.id}
              onClick={() => onSelectGame(g.id)}
            >
              <StCardEmoji>{g.emoji}</StCardEmoji>
              <StCardContent>
                <StCardTitle>{g.name}</StCardTitle>
                <StCardDesc>{g.desc}</StCardDesc>
              </StCardContent>
              {selectedGame === g.id && <StCheck>✔</StCheck>}
            </StGameCard>
          ))}
        </StGameGrid>
      ) : (
        <StSelectedGameBanner>
          {(() => {
            const game = GAME_TYPES.find((g) => g.id === selectedGame);
            return (
              <>
                <StBannerEmoji>{game?.emoji}</StBannerEmoji>
                <StBannerText>
                  <StBannerTitle>{game?.name}</StBannerTitle>
                  <StBannerDesc>{game?.desc}</StBannerDesc>
                </StBannerText>
              </>
            );
          })()}
        </StSelectedGameBanner>
      )}
    </StGameSection>
  );
}

const StGameSection = styled.div`
  padding: 1rem 1.5rem;
  background: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
`;
const StLabel = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray500};
  font-weight: bold;
  display: block;
  margin-bottom: 0.8rem;
`;
const StGameGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
`;
const StGameCard = styled.div<{ $active: boolean }>`
  border: 2px solid ${({ $active, theme }) => ($active ? theme.colors.blue500 : "#e9ecef")};
  background: ${({ $active }) => ($active ? "#f8faff" : "white")};
  border-radius: 16px;
  padding: 1rem;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
`;
const StCardEmoji = styled.div`
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
`;
const StCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;
const StCardTitle = styled.h4`
  font-size: 0.95rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.gray800};
`;
const StCardDesc = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray500};
  line-height: 1.3;
  word-break: keep-all;
`;
const StCheck = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  color: ${({ theme }) => theme.colors.blue500};
  font-weight: bold;
  font-size: 1.2rem;
`;
const StSelectedGameBanner = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 2px solid ${({ theme }) => theme.colors.gray800};
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;
const StBannerEmoji = styled.div`
  font-size: 2rem;
`;
const StBannerText = styled.div`
  display: flex;
  flex-direction: column;
`;
const StBannerTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray800};
`;
const StBannerDesc = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray600};
  margin-top: 0.2rem;
`;
