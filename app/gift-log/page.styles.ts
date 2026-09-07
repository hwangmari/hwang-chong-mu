import styled from "styled-components";
import {
  StFieldGrid,
  StFieldLabel,
  StSection,
  StSectionTitle,
  StSegmentButton,
  StSegmented,
} from "@/components/styled/layout.styled";

/*
 * 페이지 뼈대(폭·제목·가이드)는 ServiceLayout 이 맡는다.
 * 여기에는 경조사비 장부에만 있는 조각(칩·막대·표·모달)만 둔다.
 */

/* 이 장부가 누구 것인지 알려주는 작은 알약 — 소개 문단 첫 줄 */
export const StOwnerPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.35rem;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.semantic.bg};
  border: 1px solid ${({ theme }) => theme.semantic.border};
  font-size: 0.74rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.subText};
`;

/* === 로그인 유도 === */

export const StLoginCard = styled(StSection)`
  padding: 2rem 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.6rem;
`;

export const StLoginEmoji = styled.span`
  font-size: 2.6rem;
`;

export const StLoginTitle = styled.h2`
  font-size: 1.05rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StLoginDesc = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray500};
  line-height: 1.55;
`;

/* === 카드 공통 === */

/* 이 페이지의 카드 한 장 = 공용 StSection. 안쪽 줄 간격만 더한다. */
export const StCard = styled(StSection)`
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

export const StCardTitle = styled(StSectionTitle)`
  margin-bottom: 0;
`;

export const StCardHint = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray400};
  line-height: 1.45;
`;

export const StEmpty = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray400};

  b {
    color: ${({ theme }) => theme.colors.blue600};
    font-weight: 800;
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

/* === 폼 === */

/* 공용 필드 그리드는 560px 카드 기준이라, 두 칸 배치의 왼쪽 열(약 500px)에서는
   한 줄씩 쌓인다. 이 페이지는 그 열이 폼 자리라 기준만 440px 로 낮춰 쓴다. */
export const StRow = styled(StFieldGrid)`
  gap: 0.9rem 1rem;

  @container (min-width: 440px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const StLabel = styled.label`
  display: grid;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray600};
`;

export const StFieldName = styled(StFieldLabel)``;

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

// 냈어요 / 받았어요 2칸 토글 — 공용 세그먼트(테두리 하나짜리 트랙)를 그대로 쓴다
export const StSegmentRow = styled(StSegmented)``;

// 고른 쪽만 방향 색(💸 분홍 / 💰 초록)으로 물들인다
export const StSegmentBtn = styled(StSegmentButton)<{ $color: string }>`
  min-height: 2.6rem;
  font-size: 0.9rem;
  color: ${({ $active, $color, theme }) =>
    $active ? $color : theme.semantic.subText};

  &:hover:not(:disabled) {
    color: ${({ $active, $color, theme }) =>
      $active ? $color : theme.semantic.text};
  }
`;

export const StActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

/* === 사람 찾기 === */

export const StNameChip = styled.button<{ $active: boolean }>`
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.blue500 : theme.colors.gray200};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.blue50 : theme.colors.white};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.blue600 : theme.colors.gray700};
  font-size: 0.82rem;
  font-weight: 800;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.12s;
`;

/* 카드 안이라 테두리 없이 배경 띠로만 구분한다 (테두리는 카드 한 겹만) */
export const StPersonBox = styled.div`
  background: ${({ theme }) => theme.semantic.bg};
  border-radius: 0.9rem;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const StPersonHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

export const StPersonName = styled.h3`
  font-size: 1.05rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

export const StTag = styled.span<{ $color: string }>`
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.15rem 0.5rem;
  border-radius: 0.4rem;
  background: ${({ $color }) => `${$color}1a`};
  color: ${({ $color }) => $color};
`;

export const StTotalsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
`;

export const StTotalBox = styled.div<{ $color: string }>`
  background: ${({ theme }) => theme.semantic.bg};
  border-left: 3px solid ${({ $color }) => $color};
  border-radius: 0.75rem;
  padding: 0.65rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

export const StTotalLabel = styled.span`
  font-size: 0.72rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray500};
`;

export const StTotalValue = styled.span`
  font-size: 1.15rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
  line-height: 1.15;
  word-break: keep-all;
`;

export const StBadge = styled.span<{ $tone: "good" | "bad" | "neutral" }>`
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.18rem 0.5rem;
  border-radius: 0.45rem;
  background: ${({ $tone }) =>
    $tone === "good" ? "#e6f7ee" : $tone === "bad" ? "#fde8ef" : "#eef0f4"};
  color: ${({ $tone }) =>
    $tone === "good" ? "#1f8a54" : $tone === "bad" ? "#c0304f" : "#7d8593"};
`;

// "지난번 결혼식에 50,000원 냈어요" 즉답 문구
export const StAnswer = styled.p`
  background: ${({ theme }) => theme.colors.blue50};
  color: ${({ theme }) => theme.colors.gray800};
  border-radius: 0.75rem;
  padding: 0.7rem 0.85rem;
  font-size: 0.88rem;
  line-height: 1.5;

  b {
    color: ${({ theme }) => theme.colors.blue600};
    font-weight: 900;
  }
`;

export const StTimeline = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

export const StTimelineRow = styled.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.gray700};
  flex-wrap: wrap;

  time {
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray500};
  }
`;

export const StAmount = styled.span<{ $color: string }>`
  margin-left: auto;
  font-weight: 900;
  color: ${({ $color }) => $color};
  white-space: nowrap;
`;

export const StGhostBtn = styled.button`
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

/* === 요약 (연도·막대) === */

export const StYearSwitch = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
`;

export const StYearBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray600};
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 0.5rem;
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
`;

export const StYearLabel = styled.span`
  min-width: 3.4rem;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StBarList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

export const StBarRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const StBarHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.gray700};

  b {
    font-weight: 800;
  }

  small {
    font-size: 0.72rem;
    color: ${({ theme }) => theme.colors.gray400};
    margin-left: 0.3rem;
  }
`;

export const StBarMeta = styled.span`
  font-size: 0.78rem;
  font-weight: 800;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.gray600};
`;

// 두 방향을 한 트랙에 나눠 그림(왼쪽 냈어요, 오른쪽 받았어요)
export const StBarTrack = styled.div`
  display: flex;
  height: 0.55rem;
  border-radius: 999px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.gray100};
`;

export const StBarFill = styled.div<{ $pct: number; $color: string }>`
  width: ${({ $pct }) => `${$pct}%`};
  background: ${({ $color }) => $color};
  transition: width 0.25s;
`;

/* === 전체 내역 === */

/* 장부 줄은 카드 속 카드가 아니라 실선으로 나눈 한 줄씩 */
export const StRecordList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const StRecordRow = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 0.8rem 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.semantic.border};
  }
`;

export const StRecordMain = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

export const StRecordTop = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
`;

export const StRecordDate = styled.span`
  font-size: 0.78rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray500};
`;

export const StRecordName = styled.span`
  font-size: 0.95rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StRecordAmount = styled.span<{ $color: string }>`
  font-size: 1rem;
  font-weight: 900;
  color: ${({ $color }) => $color};
`;

export const StRecordMemo = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.gray500};
  line-height: 1.45;
  white-space: pre-wrap;
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

/* === 가계부에서 가져오기 === */

export const StImportList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const StImportRow = styled.div<{ $muted?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.8rem 0;
  opacity: ${({ $muted }) => ($muted ? 0.55 : 1)};

  & + & {
    border-top: 1px solid ${({ theme }) => theme.semantic.border};
  }
`;

export const StImportMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.gray600};

  time {
    font-weight: 800;
    color: ${({ theme }) => theme.colors.gray500};
  }
`;

export const StImportHint = styled.p`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.gray400};
  line-height: 1.4;
  word-break: break-all;
`;

export const StImportFields = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.5rem;
  align-items: start;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

export const StSmallInput = styled.input`
  width: 100%;
  min-width: 0;
  min-height: 2.4rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.6rem;
  background: ${({ theme }) => theme.colors.white};
  padding: 0 0.65rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray900};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.blue500};
  }
`;

export const StPrimarySmallBtn = styled.button`
  min-height: 2.4rem;
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
    opacity: 0.45;
    cursor: default;
  }
`;

/* === 전체 내역: 표 보기 === */

export const StTableWrap = styled.div`
  overflow-x: auto;
`;

/* 체크한 여러 명의 관계를 한 번에 바꾸는 줄 */
export const StBulkBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin-bottom: 0.9rem;
  padding: 0.8rem 0.9rem;
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.colors.blue50};
`;

export const StBulkTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.86rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StBulkRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;

  @media ${({ theme }) => theme.media.mobile} {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const StTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;

  th.check,
  td.check {
    width: 1.6rem;
    padding-right: 0;
  }

  th,
  td {
    padding: 0.5rem 0.55rem;
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray100};
    text-align: left;
    white-space: nowrap;
  }

  th {
    font-size: 0.72rem;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.gray500};
    background: ${({ theme }) => theme.colors.gray50};
  }

  td.amount,
  th.amount {
    text-align: right;
    font-weight: 900;
  }

  td.memo {
    white-space: normal;
    color: ${({ theme }) => theme.colors.gray500};
    max-width: 16rem;
  }

  tfoot td {
    font-weight: 900;
    color: ${({ theme }) => theme.colors.gray900};
    background: ${({ theme }) => theme.colors.gray50};
    border-bottom: none;
  }
`;

export const StGroupHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.4rem;
`;

export const StGroupTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

export const StGroupMeta = styled.span`
  font-size: 0.78rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray500};
`;

export const StRowActionBtn = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.gray400};
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.15rem 0.3rem;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.blue600};
  }
`;

export const StGhostDangerBtn = styled.button`
  min-height: 2.4rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.82rem;
  font-weight: 800;
  padding: 0 0.8rem;
  border-radius: 0.6rem;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.colors.rose600};
    border-color: ${({ theme }) => theme.colors.rose200};
  }
`;

/* === 수정 모달 (QuickActionModal과 같은 고정 오버레이 방식) === */

export const StModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(0, 0, 0, 0.4);
`;

export const StModalBox = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 130;
  width: min(36rem, calc(100vw - 1.5rem));
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  border-radius: 1.25rem;
  box-shadow: 0 18px 40px -12px rgba(23, 43, 77, 0.45);

  /* 안쪽 카드 테두리·아래 여백은 모달 상자에 맡긴다 */
  > div {
    border: none;
    margin-bottom: 0;
  }
`;
