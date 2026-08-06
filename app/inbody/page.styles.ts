import styled from "styled-components";

export const StPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 1rem 1rem 2.5rem;
`;

export const StHeader = styled.header`
  padding: 0.5rem 0.25rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

export const StRoomBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

export const StRoomName = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray600};
`;

export const StLogout = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.4rem 0.7rem;
  border-radius: 0.6rem;
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.colors.rose600};
    border-color: ${({ theme }) => theme.colors.rose200};
  }
`;

export const StTitle = styled.h1`
  font-size: 1.35rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StSubtitle = styled.p`
  margin-top: 0.2rem;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray500};
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
`;

export const StCardTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StSelectorBtn = styled.button`
  border: 1px dashed ${({ theme }) => theme.colors.blue200};
  background: ${({ theme }) => theme.colors.blue50};
  color: ${({ theme }) => theme.colors.blue600};
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.4rem 0.75rem;
  border-radius: 0.6rem;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.blue100};
  }
`;

export const StSelectorBox = styled.div`
  background: ${({ theme }) => theme.colors.gray50};
  border-radius: 0.75rem;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const StSelectorHelp = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray500};
  line-height: 1.45;
`;

export const StChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

export const StChip = styled.button<{ $active: boolean; $color: string }>`
  border: 1px solid
    ${({ $active, $color, theme }) => ($active ? $color : theme.colors.gray200)};
  background: ${({ $active, $color, theme }) =>
    $active ? `${$color}1a` : theme.colors.white};
  color: ${({ $active, $color, theme }) =>
    $active ? $color : theme.colors.gray500};
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.35rem 0.7rem;
  border-radius: 0.55rem;
  cursor: pointer;
  transition: all 0.12s;
`;

export const StRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.7rem;
`;

export const StFormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.7rem;
`;

export const StLabel = styled.label`
  display: grid;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray600};
`;

export const StFieldHead = styled.span`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.35rem;
`;

export const StFieldName = styled.span`
  font-size: 0.78rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray700};
`;

export const StFieldUnit = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray400};
`;

export const StInput = styled.input`
  width: 100%;
  min-width: 0;
  min-height: 2.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.7rem;
  background: ${({ theme }) => theme.colors.white};
  padding: 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray900};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.blue500};
    box-shadow: 0 0 0 3px rgba(79, 124, 255, 0.12);
  }
`;

export const StTextarea = styled.textarea`
  width: 100%;
  min-width: 0;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.7rem;
  padding: 0.6rem 0.75rem;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  color: ${({ theme }) => theme.colors.gray900};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.blue500};
  }
`;

export const StError = styled.p`
  color: ${({ theme }) => theme.colors.rose600};
  background: ${({ theme }) => theme.colors.rose50};
  padding: 0.5rem 0.75rem;
  border-radius: 0.6rem;
  font-size: 0.82rem;
  font-weight: 700;
`;

export const StActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

export const StEmpty = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray400};

  b {
    color: ${({ theme }) => theme.colors.blue600};
    font-weight: 800;
  }
`;

export const StMetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.7rem;
`;

export const StMetricCard = styled.div<{ $color: string }>`
  background: ${({ theme }) => theme.colors.gray50};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-left: 3px solid ${({ $color }) => $color};
  border-radius: 0.85rem;
  padding: 0.75rem 0.85rem 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const StMetricTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const StMetricName = styled.span`
  font-size: 0.82rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray700};
`;

export const StMetricCount = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray400};
`;

export const StMetricValueRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
`;

export const StMetricValue = styled.span`
  font-size: 1.4rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
  line-height: 1.1;

  span {
    font-size: 0.8rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray500};
    margin-left: 0.2rem;
  }
`;

export const StMetricDelta = styled.span<{ $tone: "good" | "bad" | "neutral" }>`
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.18rem 0.5rem;
  border-radius: 0.45rem;
  background: ${({ $tone }) =>
    $tone === "good" ? "#e6f7ee" : $tone === "bad" ? "#fde8ef" : "#eef0f4"};
  color: ${({ $tone }) =>
    $tone === "good" ? "#1f8a54" : $tone === "bad" ? "#c0304f" : "#7d8593"};
`;

export const StSparkEmpty = styled.p`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray400};
  text-align: center;
  padding: 1.1rem 0;
`;

export const StRecordList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

export const StRecordRow = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 0.8rem;
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 0.9rem;
`;

export const StRecordMain = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

export const StRecordDate = styled.span`
  font-size: 0.8rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray500};
`;

export const StRecordStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

export const StStatChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.55rem;
  background: ${({ theme }) => theme.colors.gray50};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 0.55rem;
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.gray700};
`;

export const StStatLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray500};
`;

export const StStatValue = styled.span`
  font-size: 0.85rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StStatDelta = styled.span<{ $tone: "good" | "bad" | "neutral" }>`
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.1rem 0.4rem;
  border-radius: 0.35rem;
  background: ${({ $tone }) =>
    $tone === "good" ? "#e6f7ee" : $tone === "bad" ? "#fde8ef" : "#eef0f4"};
  color: ${({ $tone }) =>
    $tone === "good" ? "#1f8a54" : $tone === "bad" ? "#c0304f" : "#7d8593"};
`;

export const StRecordMemo = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.gray500};
  line-height: 1.45;
`;

export const StRecordActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const StEditBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray600};
  padding: 0.35rem 0.7rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
`;

export const StDelBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.rose200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.rose600};
  padding: 0.35rem 0.7rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
`;
