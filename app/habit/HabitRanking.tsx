// app/habit/HabitRanking.tsx
import styled from "styled-components";
import { GoalItem } from "./useMonthlyTracker"; // GoalItem 타입 가져오기
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"; // 1등 왕관 아이콘 (없으면 생략 가능)

interface Props {
  items: GoalItem[];
  rawLogs: { item_id: number }[];
  themeColor: string;
}

export default function HabitRanking({ items, rawLogs, themeColor }: Props) {
  // 1. 항목별 횟수 계산 및 정렬 (내림차순)
  const ranking = items
    .map((item) => {
      const count = rawLogs.filter((log) => log.item_id === item.id).length;
      return { ...item, count };
    })
    .sort((a, b) => b.count - a.count);
  // 횟수가 0인 항목은 제외하고 싶다면 아래 주석 해제
  // .filter((item) => item.count > 0);

  // 기록이 없을 때 표시
  if (ranking.length === 0 || ranking.every((r) => r.count === 0)) {
    return null;
  }

  // 가장 높은 횟수 (그래프 비율 계산용)
  const maxCount = ranking[0]?.count || 1;

  return (
    <StContainer>
      <StList>
        {ranking.map((item, index) => (
          <StItem key={item.id}>
            <StRank $isTop={index < 3}>{index + 1}위</StRank>
            <StContent>
              <StInfo>
                <span className="title">{item.title}</span>
                <span className="count" style={{ color: themeColor }}>
                  {item.count}회
                </span>
              </StInfo>
              {/* 바 그래프 효과 */}
              <StProgressBarBg>
                <StProgressBar
                  $width={(item.count / maxCount) * 100}
                  $color={themeColor}
                />
              </StProgressBarBg>
            </StContent>
          </StItem>
        ))}
      </StList>
    </StContainer>
  );
}

// ✨ 스타일 정의
const StContainer = styled.div`
  margin-top: 1rem;
  padding: 1.5rem;
  background-color: #ffffff;
  border-radius: 12px;
`;

const StList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const StItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StRank = styled.div<{ $isTop: boolean }>`
  width: 36px;
  font-size: 0.9rem;
  font-weight: 800;
  color: ${({ $isTop }) =>
    $isTop ? "#f59e0b" : "#94a3b8"}; // 1~3위는 금색 계열
`;

const StContent = styled.div`
  flex: 1;
`;

const StInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 4px;

  .title {
    font-weight: 600;
    color: #475569;
  }
  .count {
    font-weight: 700;
  }
`;

const StProgressBarBg = styled.div`
  width: 100%;
  height: 6px;
  background-color: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
`;

const StProgressBar = styled.div<{ $width: number; $color: string }>`
  width: ${({ $width }) => $width}%;
  height: 100%;
  background-color: ${({ $color }) => $color};
  border-radius: 3px;
  transition: width 0.5s ease-out;
`;
