import styled from "styled-components";

export const StPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 1rem 1rem 2.5rem;
`;

export const StHeader = styled.header`
  padding: 0.5rem 0.25rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const StTitle = styled.h1`
  font-size: 1.35rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StSubtitle = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray500};
  line-height: 1.5;
`;

/* 상단 숫자 요약 (라운드·경기·선수) */
export const StStatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const StStatBox = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 0.9rem;
  padding: 0.75rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

export const StStatValue = styled.span`
  font-size: 1.3rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StStatLabel = styled.span`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray400};
`;

export const StCard = styled.section`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 1.1rem;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

export const StCardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

export const StCardTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StCardHint = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray400};
  line-height: 1.45;
`;

export const StNotice = styled.p<{ $tone: "info" | "warn" | "error" }>`
  font-size: 0.8rem;
  line-height: 1.5;
  padding: 0.7rem 0.9rem;
  border-radius: 0.8rem;
  font-weight: 600;
  background: ${({ $tone, theme }) =>
    $tone === "error"
      ? theme.colors.rose50
      : $tone === "warn"
        ? "#fff7ed"
        : theme.colors.blue50};
  color: ${({ $tone, theme }) =>
    $tone === "error"
      ? theme.colors.rose600
      : $tone === "warn"
        ? "#c2410c"
        : theme.colors.blue600};
`;

/* 탭 (대진표 / 순위 / 선수별) */
export const StTabRow = styled.div`
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
`;

export const StTab = styled.button<{ $active: boolean }>`
  border: 1px solid
    ${({ $active, theme }) => ($active ? theme.colors.blue500 : theme.colors.gray200)};
  background: ${({ $active, theme }) => ($active ? theme.colors.blue600 : theme.colors.white)};
  color: ${({ $active, theme }) => ($active ? theme.colors.white : theme.colors.gray700)};
  font-size: 0.85rem;
  font-weight: 800;
  padding: 0.5rem 0.95rem;
  border-radius: 999px;
  cursor: pointer;
`;

export const StChipRow = styled.div`
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
`;

export const StChip = styled.button<{ $active: boolean; $color: string }>`
  border: 1px solid ${({ $active, $color, theme }) => ($active ? $color : theme.colors.gray200)};
  background: ${({ $active, $color, theme }) => ($active ? $color : theme.colors.white)};
  color: ${({ $active, theme }) => ($active ? theme.colors.white : theme.colors.gray700)};
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  cursor: pointer;
`;

export const StTag = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  font-size: 0.7rem;
  font-weight: 800;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}14`};
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  white-space: nowrap;
`;

/* 라운드 묶음 */
export const StRoundHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.35rem 0.1rem;
  border-bottom: 2px solid ${({ theme }) => theme.colors.gray100};
`;

export const StRoundTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StRoundTime = styled.span`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 600;
`;

export const StMatchGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

/* 경기 카드 */
export const StMatch = styled.article<{ $color: string; $done: boolean }>`
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-left: 4px solid ${({ $color }) => $color};
  border-radius: 0.9rem;
  padding: 0.8rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  background: ${({ $done, theme }) => ($done ? theme.colors.gray50 : theme.colors.white)};
`;

export const StMatchMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 700;
`;

export const StTeams = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 0.5rem;
`;

export const StTeam = styled.div<{ $winner: boolean; $align: "left" | "right" }>`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  align-items: ${({ $align }) => ($align === "left" ? "flex-start" : "flex-end")};
  opacity: ${({ $winner }) => ($winner ? 1 : 0.85)};
`;

export const StTeamLabel = styled.span<{ $color: string }>`
  font-size: 0.68rem;
  font-weight: 900;
  color: ${({ $color }) => $color};
`;

export const StPlayerLine = styled.span<{ $strong: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  font-weight: ${({ $strong }) => ($strong ? 900 : 700)};
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StYears = styled.span`
  font-size: 0.68rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 600;
`;

export const StVs = styled.span`
  font-size: 0.72rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray300};
`;

/* 점수 입력 줄 */
export const StScoreRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

export const StScoreInput = styled.input`
  width: 3.4rem;
  min-height: 2.5rem;
  text-align: center;
  font-size: 1.15rem;
  font-weight: 900;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.6rem;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray900};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.blue500};
  }
`;

export const StScoreColon = styled.span`
  font-size: 1.1rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray400};
`;

export const StSaveBtn = styled.button`
  min-height: 2.5rem;
  border: none;
  background: ${({ theme }) => theme.semantic.primary};
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.82rem;
  font-weight: 800;
  padding: 0 0.9rem;
  border-radius: 0.6rem;
  cursor: pointer;
  white-space: nowrap;

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

export const StGhostBtn = styled.button`
  min-height: 2.2rem;
  border: 1px dashed ${({ theme }) => theme.colors.gray300};
  background: transparent;
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0 0.7rem;
  border-radius: 0.6rem;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.gray50};
  }
`;

export const StResultBadge = styled.span<{ $tone: "win" | "loss" | "draw" | "todo" }>`
  font-size: 0.7rem;
  font-weight: 900;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  white-space: nowrap;
  color: ${({ $tone, theme }) =>
    $tone === "win"
      ? theme.colors.teal600
      : $tone === "loss"
        ? theme.colors.rose600
        : $tone === "draw"
          ? "#b45309"
          : theme.colors.gray400};
  background: ${({ $tone, theme }) =>
    $tone === "win"
      ? theme.colors.teal50
      : $tone === "loss"
        ? theme.colors.rose50
        : $tone === "draw"
          ? "#fffbeb"
          : theme.colors.gray100};
`;

/* 순위표 */
export const StTableWrap = styled.div`
  overflow-x: auto;
`;

export const StTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;

  th,
  td {
    padding: 0.55rem 0.5rem;
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray100};
    text-align: center;
    white-space: nowrap;
  }

  th {
    font-size: 0.72rem;
    color: ${({ theme }) => theme.colors.gray400};
    font-weight: 800;
  }

  td.name,
  th.name {
    text-align: left;
  }

  td.rank {
    font-weight: 900;
    color: ${({ theme }) => theme.colors.gray900};
  }

  td.points {
    font-weight: 900;
    color: ${({ theme }) => theme.colors.blue600};
    font-size: 0.95rem;
  }

  td.muted {
    color: ${({ theme }) => theme.colors.gray400};
  }

  tr.top td {
    background: ${({ theme }) => theme.colors.blue50};
  }
`;

export const StNameCell = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: none;
  background: transparent;
  padding: 0;
  font-size: 0.9rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  cursor: pointer;
`;

/* 선수별 일정 */
export const StScheduleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const StScheduleRow = styled.div<{ $color: string }>`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-left: 4px solid ${({ $color }) => $color};
  border-radius: 0.8rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: auto minmax(0, 1fr);
  }
`;

export const StScheduleTime = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 700;
  min-width: 4.5rem;
`;

export const StScheduleMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
`;

export const StScheduleLine = styled.span`
  font-size: 0.88rem;
  color: ${({ theme }) => theme.colors.gray900};
  font-weight: 700;

  b {
    font-weight: 900;
  }

  em {
    font-style: normal;
    color: ${({ theme }) => theme.colors.gray400};
    font-weight: 600;
    font-size: 0.78rem;
  }
`;

export const StScheduleScore = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};

  @media ${({ theme }) => theme.media.mobile} {
    grid-column: 2;
    justify-self: start;
  }
`;

export const StEmpty = styled.p`
  padding: 1.2rem 0;
  text-align: center;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray400};
`;
