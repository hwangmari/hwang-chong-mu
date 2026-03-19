import styled from "styled-components";

export const SurfaceCard = styled.section`
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid #dbe7f4;
  border-radius: 28px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.07);
  padding: 1.5rem;

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 22px;
  }
`;

export const RuleSelectorCard = styled.div`
  margin-bottom: 1rem;
  padding: 1rem 1.1rem;
  border-radius: 20px;
  background: #f8fbff;
  border: 1px solid #dbe7f4;
`;

export const RuleSelectorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;

  > div:first-child {
    flex: 1;
    min-width: 0;
  }

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

export const RuleSelectorTitle = styled.strong`
  display: block;
  color: #123865;
  font-size: 0.98rem;
`;

export const RuleSelectorDescription = styled.p`
  margin: 0.35rem 0 0;
  color: #5a718d;
  font-size: 0.9rem;
  line-height: 1.55;
`;

export const RuleSelectorTabs = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  width: 196px;
  flex-shrink: 0;

  @media (max-width: 720px) {
    width: 100%;
  }
`;

export const RuleSelectorButton = styled.button<{ $isActive: boolean }>`
  width: 100%;
  border: 1px solid ${({ $isActive }) => ($isActive ? "#234f8d" : "#d2dceb")};
  background: ${({ $isActive }) => ($isActive ? "#234f8d" : "#ffffff")};
  color: ${({ $isActive }) => ($isActive ? "#ffffff" : "#475569")};
  border-radius: 999px;
  padding: 0.85rem 1rem;
  font-size: 0.96rem;
  font-weight: 700;
  cursor: pointer;
  text-align: center;
`;

export const TabList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

export const TabButton = styled.button<{ $isActive: boolean }>`
  border: 1px solid ${({ $isActive }) => ($isActive ? "#234f8d" : "#d2dceb")};
  background: ${({ $isActive }) => ($isActive ? "#234f8d" : "#f8fbff")};
  color: ${({ $isActive }) => ($isActive ? "#ffffff" : "#4a5d78")};
  border-radius: 16px;
  padding: 0.85rem 1rem;
  font-size: 0.98rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(59, 130, 246, 0.14);
  }
`;

export const TabPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const GuideText = styled.p`
  margin: 0;
  padding: 1rem 1.1rem;
  border-radius: 18px;
  background: #eef5ff;
  color: #39506c;
  line-height: 1.7;
  font-size: 0.95rem;
`;

export const SplitGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

export const DurationCard = styled.div`
  border: 1px solid #dbe7f4;
  background: #f8fbff;
  border-radius: 18px;
  padding: 1rem;
`;

export const DurationInputs = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  margin-top: 0.6rem;
`;

export const FieldLabel = styled.label`
  font-size: 0.92rem;
  font-weight: 700;
  color: #2d3b4f;
`;

export const CompactInput = styled.input`
  width: 64px;
  min-height: 48px;
  padding: 0.8rem 0.85rem;
  border: 1px solid #d3deed;
  border-radius: 14px;
  background: #ffffff;
  font-size: 1rem;
  outline: none;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
  }
`;

export const UnitText = styled.span`
  color: #64748b;
  font-weight: 600;
`;

export const PrimaryButton = styled.button`
  border: none;
  border-radius: 16px;
  background: #234f8d;
  color: #ffffff;
  padding: 0.95rem 1.15rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid #1c4277;
  box-shadow: 0 8px 18px rgba(35, 79, 141, 0.14);
  transition:
    background-color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    background: #1d457d;
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(35, 79, 141, 0.18);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    transform: none;
    box-shadow: none;
  }
`;

export const DangerButton = styled(PrimaryButton)`
  background: #c53b3b;
  border-color: #b43333;
  box-shadow: 0 8px 16px rgba(197, 59, 59, 0.12);

  &:hover {
    background: #b43333;
    box-shadow: 0 10px 18px rgba(197, 59, 59, 0.16);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
`;

export const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #cfe0fb;
  border-radius: 12px;
  background: #ffffff;
  color: #234f8d;
  padding: 0.72rem 0.9rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const DangerGhostButton = styled(SecondaryButton)`
  border-color: #fecaca;
  color: #b91c1c;
`;

export const ResultBox = styled.pre`
  margin: 0;
  padding: 1rem 1.1rem;
  border-radius: 18px;
  background: #0f172a;
  color: #f8fafc;
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
  border-radius: 18px;
  background: #f7fbff;
  border: 1px solid #dbe7f4;

  span {
    color: #64748b;
    font-size: 0.85rem;
  }

  strong {
    color: #0f172a;
    font-size: 1.05rem;
  }
`;

export const StorageCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1rem 1.1rem;
  border-radius: 20px;
  background: #f8fbff;
  border: 1px solid #dbe7f4;
`;

export const StorageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

export const StorageTitle = styled.strong`
  display: block;
  color: #123865;
  font-size: 0.98rem;
`;

export const StorageDescription = styled.p`
  margin: 0.35rem 0 0;
  color: #5a718d;
  font-size: 0.9rem;
  line-height: 1.55;
`;

export const StorageModeTabs = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.45rem;
`;

export const StorageModeButton = styled.button<{ $isActive: boolean }>`
  border: 1px solid ${({ $isActive }) => ($isActive ? "#234f8d" : "#d2dceb")};
  background: ${({ $isActive }) => ($isActive ? "#234f8d" : "#ffffff")};
  color: ${({ $isActive }) => ($isActive ? "#ffffff" : "#475569")};
  border-radius: 999px;
  padding: 0.55rem 0.85rem;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
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
  padding: 0.9rem;
  border-radius: 16px;
  border: 1px solid #dbe7f4;
  background: #ffffff;
`;

export const StorageLabel = styled.label`
  color: #2d3b4f;
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
  border: 1px solid #d3deed;
  border-radius: 14px;
  background: #ffffff;
  font-size: 0.95rem;
  outline: none;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
  }
`;

export const StorageHint = styled.p`
  margin: 0;
  color: #5a718d;
  font-size: 0.9rem;
  line-height: 1.6;
`;

export const ConnectedRoomCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.95rem 1rem;
  border-radius: 16px;
  border: 1px solid #dbe7f4;
  background: #ffffff;

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const ConnectedRoomInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  span {
    color: #64748b;
    font-size: 0.82rem;
    font-weight: 700;
  }

  strong {
    color: #0f172a;
    font-size: 1rem;
  }

  small {
    color: #64748b;
    font-size: 0.82rem;
  }
`;

export const StorageActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const NoticeCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem 1.1rem;
  border-radius: 18px;
  background: #eef5ff;
  border: 1px solid #cfe0fb;
  color: #234f8d;

  strong {
    font-size: 0.96rem;
    color: #123865;
  }

  span {
    font-size: 0.9rem;
    color: #31567d;
  }
`;

export const TargetDayTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 10px;
`;

export const NoticeContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const TargetDayButton = styled.button<{ $isActive: boolean }>`
  border: 1px solid ${({ $isActive }) => ($isActive ? "#234f8d" : "#cfe0fb")};
  background: ${({ $isActive }) => ($isActive ? "#234f8d" : "#ffffff")};
  color: ${({ $isActive }) => ($isActive ? "#ffffff" : "#234f8d")};
  border-radius: 999px;
  padding: 0.35rem 0.45rem;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
`;

export const SectionDivider = styled.hr`
  margin: 1.75rem 0 1.25rem;
  border: none;
  border-top: 1px solid #e2e8f0;
`;

export const SectionHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

export const SectionTitle = styled.h2`
  margin: 0;
  color: #0f172a;
  font-size: 1.08rem;
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
  border: 1px solid #d2dceb;
  background: #ffffff;
  color: #334155;
  border-radius: 12px;
  padding: 0.55rem 0.8rem;
  font-weight: 700;
  cursor: pointer;
`;

export const TodayButton = styled(CalendarNavButton)`
  background: #eef5ff;
  color: #234f8d;
  border-color: #cfe0fb;
`;

export const CalendarMonthLabel = styled.strong`
  color: #0f172a;
  font-size: 1rem;
  font-weight: 800;
  margin-right: 0.2rem;
`;

export const WeekendToggleButton = styled.button<{ $isActive: boolean }>`
  border: 1px solid ${({ $isActive }) => ($isActive ? "#234f8d" : "#d2dceb")};
  background: ${({ $isActive }) => ($isActive ? "#eef5ff" : "#ffffff")};
  color: ${({ $isActive }) => ($isActive ? "#234f8d" : "#475569")};
  border-radius: 12px;
  padding: 0.55rem 0.8rem;
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
  color: #64748b;
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
  border-radius: 16px;
  padding: 0.7rem;
  border: 1px solid
    ${({ $isSelected, $isToday }) =>
      $isSelected ? "#234f8d" : $isToday ? "#60a5fa" : "#dbe7f4"};
  background: ${({ $isSelected }) => ($isSelected ? "#eef5ff" : "#ffffff")};
  color: ${({ $isCurrentMonth }) => ($isCurrentMonth ? "#0f172a" : "#94a3b8")};
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
  color: #334155;

  span {
    display: block;
    background: #f8fbff;
    border-radius: 10px;
    padding: 0.2rem 0.35rem;
  }
`;

export const MutedPrefix = styled.span`
  color: #8a99b2;
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
  color: #123865;
  font-size: 0.96rem;
`;

export const EditCancelButton = styled.button`
  border: 1px solid #d2dceb;
  background: #ffffff;
  color: #475569;
  border-radius: 12px;
  padding: 0.5rem 0.75rem;
  font-weight: 700;
  cursor: pointer;
`;

export const AccordionSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  border: 1px solid #dbe7f4;
  background: #f8fbff;
  border-radius: 20px;
  padding: 1rem;
`;

export const AccordionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

export const AccordionToggleButton = styled.button`
  border: 1px solid #d2dceb;
  background: #ffffff;
  color: #234f8d;
  border-radius: 12px;
  padding: 0.55rem 0.8rem;
  font-weight: 700;
  cursor: pointer;
`;

export const AccordionHint = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.92rem;
  line-height: 1.6;
`;

export const SubText = styled.p`
  margin: 0.85rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.6;
`;

export const RecordList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

export const RecordItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1rem;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;

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
  border: none;
  border-radius: 12px;
  background: #e0ecff;
  color: #1d4f91;
  padding: 0.65rem 0.8rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const EmptyItem = styled.div`
  padding: 1rem;
  border-radius: 16px;
  background: #f8fafc;
  color: #64748b;
  border: 1px dashed #cbd5e1;
`;

export const RecordInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  strong {
    color: #0f172a;
  }

  span {
    color: #64748b;

    ${MutedPrefix} {
      display: inline-block;
      width: 70px;
    }
  }
`;

export const DeleteButton = styled.button`
  border: none;
  border-radius: 12px;
  background: #fee2e2;
  color: #b91c1c;
  padding: 0.65rem 0.8rem;
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
  gap: 0.65rem;
`;

export const GuidePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 20px;
  background: #f8fbff;
  border: 1px solid #dbe7f4;
`;

export const GuideTitle = styled.h3`
  margin: 0;
  color: #123865;
  font-size: 1rem;
  font-weight: 800;
`;

export const GuideList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

export const GuideItem = styled.li`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 0.95rem;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #dbe7f4;
  color: #334155;

  strong {
    color: #0f172a;
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
  padding: 0.95rem 1rem;
  border-radius: 16px;
  background: #f8fbff;
  border: 1px solid #dbe7f4;
  color: #334155;

  strong {
    color: #0f172a;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 0.3rem;
  }
`;
