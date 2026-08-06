import styled from "styled-components";

import type { StockTradeSide } from "../types";

export const StPage = styled.main`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 200;
  overflow: auto;
  overscroll-behavior: none;
  min-height: 100dvh;
  background: ${({ theme }) => theme.colors.gray100};
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;

  @media (max-width: 720px) {
    padding: 0.75rem;
  }
`;

export const StCenterCard = styled.div`
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  border-radius: 20px;
  border: 1px solid #e4e5e6;
  background: #ffffff;
  padding: 1.6rem;
  font-size: 0.9rem;
  color: #5a606a;
`;

export const StBackTextButton = styled.button`
  border: 1px solid #dfe1e4;
  border-radius: 999px;
  background: #ffffff;
  color: #3182f6;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
`;

export const StHeader = styled.header`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;

export const StBackButton = styled.button`
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #595c62;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;

  svg {
    width: 2rem;
    height: 2rem;
    fill: currentColor;
  }
`;

export const StHeaderTitle = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;

  strong {
    font-size: 1.05rem;
    font-weight: 900;
    color: #222b36;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    font-size: 0.74rem;
    color: #868a92;
    font-weight: 700;
  }
`;

export const StRefresh = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;

  span {
    font-size: 0.72rem;
    color: #868a92;
    font-weight: 700;
    white-space: nowrap;
  }

  button {
    border: 1px solid #dfe1e4;
    border-radius: 999px;
    background: #ffffff;
    color: #5a606a;
    padding: 0.4rem 0.75rem;
    font-size: 0.74rem;
    font-weight: 800;
    cursor: pointer;
  }
`;

export const StSummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.7rem;

  @media (max-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const StSummaryCard = styled.div`
  border: 1px solid #e8e9ea;
  border-radius: 18px;
  background: #ffffff;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  span {
    font-size: 0.74rem;
    color: #82868d;
    font-weight: 700;
  }

  strong {
    font-size: 1.05rem;
    font-weight: 900;
    color: #222b36;
    letter-spacing: -0.01em;
  }

  em {
    font-style: normal;
    font-size: 0.72rem;
    color: #8a8e95;
    font-weight: 700;
  }
`;

export const StCard = styled.section`
  border-radius: 20px;
  border: 1px solid #e4e5e6;
  background: #ffffff;
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

export const StCardTitle = styled.h2`
  font-size: 1rem;
  font-weight: 900;
  color: #2b3441;
`;

export const StCardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

export const StSortChips = styled.div`
  display: flex;
  gap: 0.3rem;
`;

export const StSortChip = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? "#3182f6" : "#e2e3e5")};
  background: ${({ $active }) => ($active ? "#eef4fe" : "#ffffff")};
  color: ${({ $active }) => ($active ? "#3182f6" : "#8a8e95")};
  border-radius: 999px;
  padding: 0.22rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 800;
  cursor: pointer;
`;

export const StEmpty = styled.p`
  font-size: 0.82rem;
  color: #8a8e95;
  line-height: 1.5;
  padding: 0.6rem 0.1rem;
`;

const TABLE_COLUMNS =
  "minmax(84px, 1.4fr) 0.7fr 0.9fr 1fr 1fr 1.1fr";

export const StTable = styled.div`
  max-width: 100%;
  overflow-x: auto;
`;

export const StTableHead = styled.div`
  display: grid;
  grid-template-columns: ${TABLE_COLUMNS};
  min-width: 520px;
  padding: 0 0.35rem 0.5rem;
  border-bottom: 1px solid #ededef;

  span {
    font-size: 0.7rem;
    font-weight: 800;
    color: #a3a7ad;
    text-align: right;
  }

  span:first-child {
    text-align: left;
  }
`;

export const StHoldingGroup = styled.div`
  min-width: 520px;
  border-bottom: 1px solid #f4f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

export const StTableRow = styled.div<{ $clickable?: boolean }>`
  display: grid;
  grid-template-columns: ${TABLE_COLUMNS};
  min-width: 520px;
  align-items: center;
  padding: 0.6rem 0.35rem;
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};

  &:hover {
    background: ${({ $clickable }) => ($clickable ? "#fafbfc" : "transparent")};
  }

  > span {
    font-size: 0.82rem;
    font-weight: 700;
    color: #333d4b;
    text-align: right;
    white-space: nowrap;
  }
`;

export const StNameCell = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;

  strong {
    font-size: 0.84rem;
    font-weight: 800;
    color: #222b36;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    font-size: 0.68rem;
    color: #a2a6ad;
    font-weight: 700;
  }
`;

export const StPriceCell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  strong {
    font-size: 0.82rem;
    font-weight: 800;
    color: #333d4b;
    white-space: nowrap;
  }

  em {
    font-style: normal;
    font-size: 0.7rem;
    font-weight: 800;
  }
`;

export const StPnlCell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  strong {
    font-size: 0.82rem;
    font-weight: 800;
    white-space: nowrap;
  }

  em {
    font-style: normal;
    font-size: 0.7rem;
    font-weight: 800;
  }
`;

export const StDetail = styled.div`
  margin: 0 0.35rem 0.4rem;
  border-radius: 14px;
  background: #f7f8fa;
  border: 1px solid #eceef1;
  padding: 0.75rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
`;

export const StDetailRow = styled.div<{ $emphasis?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.32rem 0;

  span {
    font-size: 0.78rem;
    font-weight: 700;
    color: ${({ $emphasis }) => ($emphasis ? "#2b3441" : "#7a808a")};
  }

  strong {
    font-size: ${({ $emphasis }) => ($emphasis ? "0.95rem" : "0.84rem")};
    font-weight: ${({ $emphasis }) => ($emphasis ? 900 : 800)};
    color: #222b36;
    white-space: nowrap;
  }
`;

export const StDetailDivider = styled.div`
  height: 1px;
  background: #e6e8eb;
  margin: 0.35rem 0;
`;

export const StCalcToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  border: none;
  background: transparent;
  padding: 0.1rem 0;
  cursor: pointer;

  span {
    font-size: 0.78rem;
    font-weight: 800;
    color: #4a515c;
  }

  em {
    font-style: normal;
    font-size: 0.7rem;
    font-weight: 700;
    color: #3182f6;
  }
`;

export const StCalcBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding-top: 0.2rem;
`;

export const StCalcInputs = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 0.5rem;
  margin-bottom: 0.2rem;
`;

export const StCalcHint = styled.p`
  font-size: 0.74rem;
  font-weight: 700;
  color: #979ba1;
`;

export const StClosed = styled.div`
  margin-top: 0.4rem;
  border-top: 1px solid #eef0f2;
  padding-top: 0.6rem;
`;

export const StClosedHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: none;
  background: transparent;
  padding: 0.3rem 0.15rem;
  cursor: pointer;

  span {
    font-size: 0.82rem;
    font-weight: 800;
    color: #5a606a;
  }

  em {
    font-style: normal;
    font-size: 0.74rem;
    font-weight: 800;
    color: #a2a6ad;
  }
`;

export const StClosedList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.3rem 0.15rem 0;
`;

export const StClosedRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.42rem 0;
  border-top: 1px dashed #eef0f2;

  &:first-child {
    border-top: none;
  }

  strong {
    font-size: 0.82rem;
    font-weight: 700;
    color: #3a3f47;
  }

  em {
    font-style: normal;
    font-size: 0.82rem;
    font-weight: 800;
    white-space: nowrap;
  }
`;

export const StForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

// 데스크톱 2단: 좌(보유 현황) | 우(매매일지). 좁은 화면은 세로 스택.
export const StSplit = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 0.8rem;
  align-items: start;

  @media (max-width: 1023px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const StFormTopRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.6rem;
  align-items: flex-end;
`;

export const StFormBottomRow = styled.div`
  display: grid;
  grid-template-columns: 0.8fr 1fr auto;
  gap: 0.6rem;
  align-items: flex-end;

  @media (max-width: 720px) {
    grid-template-columns: 1fr 1fr;

    /* 기록 버튼은 모바일에서 한 줄 전체 사용 */
    & > :nth-child(3) {
      grid-column: 1 / -1;
    }
  }
`;

export const StFormField = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.32rem;

  label {
    font-size: 0.74rem;
    font-weight: 700;
    color: #6a6f78;
  }
`;

export const StInput = styled.input`
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid #e2e3e5;
  border-radius: 12px;
  padding: 0.6rem 0.7rem;
  font-size: 0.9rem;
  color: #222b36;
  outline: none;

  &:focus {
    border-color: #a9c0f5;
  }
`;

export const StSideToggle = styled.div`
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
`;

export const StSideOption = styled.button<{ $active: boolean; $side: StockTradeSide }>`
  border: 1px solid
    ${({ $active, $side }) =>
      $active ? ($side === "buy" ? "#d64c4c" : "#3182f6") : "#e2e3e5"};
  background: ${({ $active, $side }) =>
    $active ? ($side === "buy" ? "#fdecec" : "#e8f2fe") : "#ffffff"};
  color: ${({ $active, $side }) =>
    $active ? ($side === "buy" ? "#d64c4c" : "#3182f6") : "#6a6f78"};
  border-radius: 12px;
  padding: 0.6rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
`;

export const StSearchWrap = styled.div`
  position: relative;
`;

export const StSearchDropdown = styled.div`
  position: absolute;
  top: calc(100% + 0.3rem);
  left: 0;
  right: 0;
  z-index: 30;
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  border: 1px solid #e9eaec;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(26, 34, 49, 0.14);
`;

export const StSearchOption = styled.button`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  border: none;
  background: transparent;
  padding: 0.55rem 0.7rem;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: #f4f5f7;
  }

  strong {
    font-size: 0.85rem;
    font-weight: 800;
    color: #2b3441;
  }

  span {
    font-size: 0.72rem;
    color: #a2a6ad;
    font-weight: 700;
  }
`;

export const StSelectedStock = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #d3e3fb;
  background: #f4f8ff;
  border-radius: 12px;
  padding: 0.55rem 0.7rem;

  strong {
    font-size: 0.9rem;
    font-weight: 800;
    color: #222b36;
  }

  span {
    font-size: 0.74rem;
    color: #7a8290;
    font-weight: 700;
  }

  button {
    margin-left: auto;
    border: none;
    background: transparent;
    color: #3182f6;
    font-size: 0.76rem;
    font-weight: 800;
    cursor: pointer;
  }
`;

export const StSubmitButton = styled.button<{ $side: StockTradeSide }>`
  border: none;
  border-radius: 12px;
  background: ${({ $side }) => ($side === "buy" ? "#d64c4c" : "#3182f6")};
  color: #ffffff;
  padding: 0.7rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;

  &:disabled {
    background: #cdd2d9;
    cursor: default;
  }
`;

export const StTradeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.4rem;
`;

export const StTradeGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

export const StTradeDateHeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const StDateChangeButton = styled.button`
  flex-shrink: 0;
  border: 1px solid #e2e3e5;
  background: #ffffff;
  color: #6a6f78;
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-size: 0.66rem;
  font-weight: 800;
  cursor: pointer;
`;

export const StDateEditBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.15rem;
`;

export const StEditSave = styled.button`
  flex-shrink: 0;
  border: none;
  background: #3182f6;
  color: #ffffff;
  border-radius: 8px;
  padding: 0.4rem 0.7rem;
  font-size: 0.72rem;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
`;

export const StEditCancel = styled.button`
  flex-shrink: 0;
  border: 1px solid #e2e3e5;
  background: #ffffff;
  color: #6a6f78;
  border-radius: 8px;
  padding: 0.4rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
`;

export const StTradeDateHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0.5rem 0.15rem 0.3rem;
  border-bottom: 1px solid #eceef1;

  span {
    font-size: 0.78rem;
    font-weight: 800;
    color: #4a515c;
  }

  em {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-style: normal;
    font-size: 0.72rem;
    font-weight: 700;
    color: #979ba1;
  }
`;

export const StTradeCaret = styled.svg<{ $open: boolean }>`
  width: 0.85rem;
  height: 0.85rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transform: rotate(${({ $open }) => ($open ? "0deg" : "-90deg")});
  transition: transform 0.15s ease;
`;

export const StTradeMore = styled.button`
  align-self: center;
  border: 1px solid #e2e3e5;
  background: #ffffff;
  color: #6a6f78;
  border-radius: 999px;
  padding: 0.3rem 0.9rem;
  margin-top: 0.35rem;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
`;

export const StTradeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.55rem 0.15rem;
  border-top: 1px solid #f0f1f3;

  &:first-child {
    border-top: none;
  }
`;

export const StTradeMeta = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  div {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  strong {
    font-size: 0.84rem;
    font-weight: 800;
    color: #2b3441;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    font-size: 0.72rem;
    color: #8a8e95;
    font-weight: 600;
  }
`;

export const StSideBadge = styled.span<{ $side: StockTradeSide }>`
  flex-shrink: 0;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.2rem 0.45rem;
  border-radius: 8px;
  color: ${({ $side }) => ($side === "buy" ? "#d64c4c" : "#3182f6")};
  background: ${({ $side }) => ($side === "buy" ? "#fdecec" : "#e8f2fe")};
`;

export const StTradeRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;

  em {
    font-style: normal;
    font-size: 0.8rem;
    font-weight: 800;
    color: #333d4b;
    white-space: nowrap;
  }
`;

export const StDeleteButton = styled.button`
  width: 1.25rem;
  height: 1.25rem;
  border: none;
  background: transparent;
  color: #b6bac1;
  font-size: 0.95rem;
  line-height: 1;
  cursor: pointer;

  &:hover {
    color: #f04452;
  }
`;
