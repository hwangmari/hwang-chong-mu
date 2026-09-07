import styled from "styled-components";
import {
  StSegmented,
} from "@/components/styled/layout.styled";

export const SurfaceCard = styled.section`
  /* 안쪽 StFieldGrid 가 '카드 폭'을 기준으로 열 수를 정할 수 있게 */
  container-type: inline-size;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 1rem;
  padding: 1.25rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

/* 계산 요건 줄 — 카드 없이 여백으로만 구분한다 (카드 안 카드 금지) */
export const RuleSelectorCard = styled.div`
  margin-bottom: 1.25rem;
`;

export const RuleSelectorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.85rem;

  > div:first-child {
    flex: 1;
    min-width: 0;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.6rem;
  }
`;

export const RuleSelectorTitle = styled.strong`
  display: block;
  color: ${({ theme }) => theme.semantic.text};
  font-size: 0.95rem;
  font-weight: 800;
`;

export const RuleSelectorDescription = styled.p`
  margin: 0.35rem 0 0;
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.9rem;
  line-height: 1.55;
`;

/* 컨트롤이므로 트랙 테두리는 남긴다 (공용 StSegmented 에 폭만 얹음) */
export const RuleSelectorTabs = styled(StSegmented)`
  width: 220px;
  flex-shrink: 0;

  @media (max-width: 640px) {
    width: 100%;
  }
`;

/* 카드 첫 줄에 오는 탭 스트립 */
export const TabList = styled(StSegmented)`
  width: 100%;
  margin-bottom: 1.25rem;
`;

export const TabPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

/* 입력 밑에 붙는 안내 — 상자 없이 보조 문단으로 */
export const GuideText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.semantic.subText};
  line-height: 1.7;
  font-size: 0.88rem;
`;

export const DurationInputs = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: nowrap;
  margin-top: 0.45rem;
`;

export const CompactInput = styled.input`
  width: 100%;
  min-width: 0;
  flex: 1 1 0;
  min-height: 2.75rem;
  padding: 0.7rem 0.5rem;
  text-align: center;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.7rem;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray900};
  font-size: 1rem;
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.blue500};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.blue100};
  }
`;

export const UnitText = styled.span`
  flex-shrink: 0;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.semantic.subText};
  font-weight: 600;
`;

export const PrimaryButton = styled.button`
  border-radius: 0.9rem;
  background: ${({ theme }) => theme.semantic.primary};
  color: ${({ theme }) => theme.colors.white};
  padding: 0.95rem 1.15rem;
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  border: none;
  transition: background-color 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.blue700};
  }

  &:disabled {
    cursor: not-allowed;
    background: ${({ theme }) => theme.colors.gray200};
    color: ${({ theme }) => theme.colors.gray500};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const DangerButton = styled(PrimaryButton)`
  background: ${({ theme }) => theme.semantic.danger};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.rose500};
  }
`;

export const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.semantic.text};
  padding: 0.72rem 0.9rem;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.semantic.bg};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const DangerGhostButton = styled(SecondaryButton)`
  border-color: ${({ theme }) => theme.colors.rose200};
  color: ${({ theme }) => theme.colors.rose600};
`;

/* 카드 안에서 색을 깔아 두는 유일한 면 — 테두리는 없다 */
export const ResultBox = styled.pre`
  margin: 0;
  padding: 1rem 1.1rem;
  border-radius: 1rem;
  background: ${({ theme }) => theme.semantic.bg};
  color: ${({ theme }) => theme.colors.gray800};
  font-family: inherit;
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 0.95rem;
`;

export const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const StatCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem 1.1rem;
  border-radius: 1rem;
  background: ${({ theme }) => theme.semantic.bg};

  span {
    color: ${({ theme }) => theme.colors.gray500};
    font-size: 0.85rem;
  }

  strong {
    color: ${({ theme }) => theme.colors.gray900};
    font-size: 1.05rem;
  }
`;

/* 카드 안 카드 대신 실선 한 줄로 구분한다 */
export const StorageCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding-top: 1.25rem;
  border-top: 1px solid ${({ theme }) => theme.semantic.border};
`;

export const StorageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;

  > div:first-child {
    flex: 1;
    min-width: 0;
  }

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

export const StorageTitle = styled.strong`
  display: block;
  color: ${({ theme }) => theme.colors.gray800};
  font-size: 0.98rem;
`;

export const StorageDescription = styled.p`
  margin: 0.35rem 0 0;
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.9rem;
  line-height: 1.55;
`;

export const StorageModeTabs = styled(StSegmented)`
  width: 190px;
  flex-shrink: 0;

  @media (max-width: 720px) {
    width: 100%;
  }
`;

export const StorageSetupGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

export const StorageSetupCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-width: 0;
`;

export const StorageLabel = styled.label`
  color: ${({ theme }) => theme.colors.gray800};
  font-size: 0.88rem;
  font-weight: 700;
`;

export const StorageInlineField = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.55rem;

  ${SecondaryButton} {
    width: 100%;
    justify-content: center;
  }
`;

export const StorageInput = styled.input`
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 0.75rem 0.85rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.7rem;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray900};
  font-size: 0.95rem;
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.blue500};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.blue100};
  }
`;

export const StorageHint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.9rem;
  line-height: 1.6;
`;

export const ConnectedRoomCard = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 320px);
  gap: 1rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

export const ConnectedRoomInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  span {
    color: ${({ theme }) => theme.colors.gray500};
    font-size: 0.82rem;
    font-weight: 700;
  }

  strong {
    color: ${({ theme }) => theme.colors.gray900};
    font-size: 1rem;
  }

  small {
    color: ${({ theme }) => theme.colors.gray500};
    font-size: 0.82rem;
    word-break: break-word;
  }
`;

export const StorageActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  align-self: start;

  > button {
    width: 100%;
    min-height: 52px;
  }

  > button:last-child {
    grid-column: 1 / -1;
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;

    > button:last-child {
      grid-column: auto;
    }
  }
`;

export const NoticeCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: ${({ theme }) => theme.colors.gray900};

  strong {
    font-size: 0.96rem;
    color: ${({ theme }) => theme.colors.gray800};
  }

  span {
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.gray700};
  }
`;

export const TargetDayTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.6rem;
`;

export const NoticeContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const TargetDayButton = styled.button<{ $isActive: boolean }>`
  min-width: 2.4rem;
  border: 1px solid
    ${({ $isActive, theme }) => ($isActive ? theme.semantic.primary : theme.semantic.border)};
  background: ${({ $isActive, theme }) => ($isActive ? theme.semantic.primary : theme.colors.white)};
  color: ${({ $isActive, theme }) => ($isActive ? theme.colors.white : theme.semantic.text)};
  border-radius: 0.6rem;
  padding: 0.4rem 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const SectionDivider = styled.hr`
  margin: 1.75rem 0 1.25rem;
  border: none;
  height: 1px;
  background: ${({ theme }) => theme.semantic.border};
`;

export const SectionHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

export const SectionTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.semantic.text};
  font-size: 0.95rem;
  font-weight: 800;
`;

export const CalendarToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  flex-wrap: wrap;
  width: 100%;
`;

export const CalendarToolbarMain = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

export const CalendarNavButton = styled.button`
  border: 1px solid ${({ theme }) => theme.semantic.border};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.semantic.text};
  border-radius: 0.6rem;
  padding: 0.55rem 0.8rem;
  font-weight: 700;
  cursor: pointer;
`;

export const TodayButton = styled(CalendarNavButton)`
  background: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray700};
  border-color: ${({ theme }) => theme.colors.gray200};
`;

export const CalendarMonthLabel = styled.strong`
  color: ${({ theme }) => theme.colors.gray900};
  font-size: 1rem;
  font-weight: 800;
  margin-right: 0.2rem;
`;

export const WeekendToggleButton = styled.button<{ $isActive: boolean }>`
  border: 1px solid ${({ theme }) => theme.semantic.border};
  background: ${({ $isActive, theme }) => ($isActive ? theme.semantic.bg : theme.colors.white)};
  color: ${({ $isActive, theme }) => ($isActive ? theme.semantic.text : theme.semantic.subText)};
  border-radius: 0.6rem;
  padding: 0.55rem 0.8rem;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
`;

export const WeekdayRow = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, minmax(0, 1fr));
  gap: 0.5rem;
`;

export const WeekdayCell = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.84rem;
  font-weight: 700;
`;

export const CalendarGrid = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, minmax(0, 1fr));
  gap: 0.5rem;

  @media (max-width: 720px) {
    gap: 0.35rem;
  }
`;

export const CalendarCellButton = styled.button<{
  $isCurrentMonth: boolean;
  $isSelected: boolean;
  $isToday: boolean;
}>`
  height: 100px;
  border-radius: 0.75rem;
  padding: 0.7rem;
  border: 1px solid
    ${({ $isSelected, $isToday, theme }) => ($isSelected ? theme.semantic.primary : $isToday ? theme.colors.gray400 : theme.semantic.border)};
  background: ${({ $isSelected, theme }) => ($isSelected ? theme.colors.blue50 : theme.colors.white)};
  color: ${({ $isCurrentMonth, theme }) => ($isCurrentMonth ? theme.colors.gray900 : theme.colors.gray400)};
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  cursor: pointer;

  @media (max-width: 720px) {
    height: 100px;
    padding: 0.55rem;
  }
`;

export const CalendarPlaceholder = styled.div`
  height: 100px;

  @media (max-width: 720px) {
    height: 100px;
  }
`;

export const CalendarDayNumber = styled.span`
  font-size: 0.95rem;
  font-weight: 800;
`;

export const CalendarDaySummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.73rem;
  line-height: 1.35;
  color: ${({ theme }) => theme.colors.gray700};

  span {
    display: block;
    background: ${({ theme }) => theme.colors.gray100};
    border-radius: 0.5rem;
    padding: 0.2rem 0.35rem;
  }
`;

export const MutedPrefix = styled.span`
  color: ${({ theme }) => theme.colors.gray500};
  font-weight: 600;
  margin-right: 0.3rem;
`;

export const SelectedDatePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`;

export const QuickAddCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

export const QuickAddHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  min-height: 35px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const QuickAddTitle = styled.strong`
  color: ${({ theme }) => theme.colors.gray800};
  font-size: 0.96rem;
`;

export const EditCancelButton = styled.button`
  border: 1px solid ${({ theme }) => theme.semantic.border};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray600};
  border-radius: 0.6rem;
  padding: 0.5rem 0.75rem;
  font-weight: 700;
  cursor: pointer;
`;

export const AccordionSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

export const AccordionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;

  > div:first-child {
    flex: 1;
    min-width: 0;
  }
`;

/* 테두리 없는 텍스트 버튼 */
export const AccordionToggleButton = styled.button`
  flex-shrink: 0;
  border: none;
  background: none;
  color: ${({ theme }) => theme.semantic.primary};
  border-radius: 0.6rem;
  padding: 0.4rem 0.2rem;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

export const AccordionHint = styled.p`
  margin: 0.3rem 0 0;
  color: ${({ theme }) => theme.semantic.subText};
  font-size: 0.88rem;
  line-height: 1.6;
`;

export const SubText = styled.p`
  margin: 0.85rem 0 0;
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.9rem;
  line-height: 1.6;
`;

export const RecordList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
`;

export const RecordItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.semantic.border};
  }

  @media (max-width: 640px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

export const RecordActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

export const EditButton = styled.button`
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.6rem;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.semantic.text};
  padding: 0.6rem 0.8rem;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const EmptyItem = styled.div`
  padding: 1rem;
  border-radius: 1rem;
  background: ${({ theme }) => theme.semantic.bg};
  color: ${({ theme }) => theme.colors.gray500};
`;

export const RecordInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  strong {
    color: ${({ theme }) => theme.colors.gray900};
  }

  span {
    color: ${({ theme }) => theme.colors.gray500};

    ${MutedPrefix} {
      display: inline-block;
      width: 70px;
    }
  }
`;

export const DeleteButton = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.rose200};
  border-radius: 0.6rem;
  background: ${({ theme }) => theme.semantic.dangerBg};
  color: ${({ theme }) => theme.semantic.danger};
  padding: 0.6rem 0.8rem;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const RuleList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
`;

export const GuidePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  /* 규칙 표 옆에 나란히 놓이므로 위 여백 없음 (좁은 화면에선 StFieldGrid gap이 간격) */
`;

export const GuideTitle = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.semantic.text};
  font-size: 0.95rem;
  font-weight: 800;
`;

export const GuideList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
`;

export const GuideItem = styled.li`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 0;
  color: ${({ theme }) => theme.colors.gray700};

  & + & {
    border-top: 1px solid ${({ theme }) => theme.semantic.border};
  }

  strong {
    color: ${({ theme }) => theme.colors.gray900};
  }

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 0.25rem;
  }
`;

export const RuleItem = styled.li`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 0;
  color: ${({ theme }) => theme.colors.gray700};

  & + & {
    border-top: 1px solid ${({ theme }) => theme.semantic.border};
  }

  strong {
    color: ${({ theme }) => theme.colors.gray900};
  }

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 0.3rem;
  }
`;
