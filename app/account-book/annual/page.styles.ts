import styled from "styled-components";

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

  @media (max-width: 720px) {
    padding: 0.75rem;
  }
`;

export const StHeader = styled.header`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0.7rem;
  align-items: center;
  margin-bottom: 1rem;
`;

export const StHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
`;

export const StHeaderCenter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
`;

export const StAmountToggle = styled.button`
  margin-left: auto;
  flex-shrink: 0;
  align-self: center;
  border: 1px solid #e2e3e4;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.white};
  color: #8a8e95;
  padding: 0.5rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    color 0.15s ease;

  &:hover {
    border-color: #d3d5d8;
    background: #f5f6f7;
    color: #656971;
  }
`;

export const StYearNav = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  button {
    width: 2.3rem;
    height: 2.3rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e2e3e5;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.white};
    color: ${({ theme }) => theme.colors.gray600};
    cursor: pointer;

    svg {
      width: 1.35rem;
      height: 1.35rem;
      fill: currentColor;
    }
  }
`;

export const StEyebrow = styled.p`
  font-size: 0.95rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray800};
  white-space: nowrap;
  padding: 0 0.15rem;

  @media (max-width: 640px) {
    font-size: 0.86rem;
  }
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


export const StHeroCard = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(min(320px, 100%), 1.05fr);
  gap: 0.9rem;
  border-radius: 24px;
  border: 1px solid #e3e4e5;
  background: rgba(255, 255, 255, 0.98);
  padding: 1rem;
  margin-bottom: 0.9rem;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

export const StHeroDescription = styled.p`
  margin-top: 0.55rem;
  font-size: 0.84rem;
  color: #7c8088;
`;

export const StInsightGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(min(280px, 100%), 0.82fr);
  gap: 0.9rem;
  margin-bottom: 0.9rem;

  @media (max-width: 1120px) {
    grid-template-columns: 1fr;
  }
`;

export const StCard = styled.section`
  border-radius: 24px;
  border: 1px solid #e4e5e6;
  background: rgba(255, 255, 255, 0.94);
  padding: 1rem;
`;

export const StSideColumn = styled.div`
  display: grid;
  gap: 0.9rem;
  align-content: start;
`;

export const StSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
`;

export const StSectionHeaderActions = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  min-width: 9.25rem;
  min-height: 2.25rem;
  flex-shrink: 0;

  @media (max-width: 720px) {
    min-width: 0;
    flex-shrink: 1;
  }
`;

export const StSectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray800};
`;

export const StSectionMeta = styled.span`
  font-size: 0.78rem;
  color: #81858d;
  font-weight: 700;
`;

export const StTotal = styled.strong`
  display: block;
  margin-top: 0.8rem;
  font-size: 2rem;
  font-weight: 900;
  color: #2a4c84;
`;

export const StStatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
`;

export const StStatCard = styled.div`
  border: 1px solid #e8e9ea;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.9rem;

  span {
    display: block;
    font-size: 0.78rem;
    color: #82868d;
    font-weight: 700;
  }

  strong {
    display: block;
    margin-top: 0.32rem;
    font-size: 1rem;
    font-weight: 900;
    color: #192c4e;
    line-height: 1.4;
  }
`;

export const StPaymentLegend = styled.div`
  display: grid;
  gap: 0.45rem;
  margin-top: 0.9rem;
`;

export const StLegendItem = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.82rem;
  color: #2c518c;

  .info {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .dot {
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 999px;
  }

  strong {
    min-width: 4rem;
  }

  em {
    font-style: normal;
    font-weight: 800;
  }

  span {
    color: #8f939a;
    font-weight: 700;
  }
`;

export const StFilterChip = styled.button`
  border: 1px solid #e9eaec;
  border-radius: 999px;
  background: #f7f7f7;
  color: #757981;
  padding: 0.45rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 800;
`;

export const StFilterChipPlaceholder = styled.span`
  display: inline-flex;
  width: 100%;
  min-height: 2.25rem;
  visibility: hidden;
`;

export const StMonthChart = styled.div`
  margin-top: 1rem;
  display: flex;
  align-items: flex-end;
  gap: 0.4rem;
  height: 128px;
  padding: 0 0.1rem;
`;

export const StMonthChartCol = styled.button<{ $active: boolean }>`
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 0.3rem;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
`;

export const StMonthChartTrack = styled.div`
  width: 100%;
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
`;

export const StMonthChartBar = styled.div<{ $active: boolean; $empty: boolean }>`
  width: 100%;
  max-width: 20px;
  border-radius: 5px 5px 2px 2px;
  background: ${({ $active, $empty }) =>
    $empty ? "#eceff3" : $active ? "#3182f6" : "#bcd3f8"};
  transition: background 0.15s ease;
`;

export const StMonthChartLabel = styled.span<{ $active: boolean }>`
  font-size: 0.66rem;
  font-weight: ${({ $active }) => ($active ? 900 : 700)};
  color: ${({ $active }) => ($active ? "#3182f6" : "#a2a6ad")};
`;

export const StMonthlyList = styled.div`
  margin-top: 0.8rem;
  display: flex;
  flex-direction: column;
`;

export const StMonthLine = styled.button<{ $active: boolean }>`
  border: none;
  border-top: 1px solid #eef0f2;
  border-radius: 8px;
  background: ${({ $active }) => ($active ? "#f5f7fb" : "transparent")};
  padding: 0.62rem 0.55rem;
  display: grid;
  grid-template-columns: 2.4rem 3rem minmax(70px, 1fr) 7rem;
  align-items: center;
  gap: 0.85rem;
  cursor: pointer;

  &:first-child {
    border-top: none;
  }

  strong {
    font-size: 0.86rem;
    font-weight: 800;
    color: ${({ $active }) => ($active ? "#3182f6" : "#2b3441")};
    text-align: left;
  }

  span {
    font-size: 0.75rem;
    color: #98a0ab;
    font-weight: 700;
    text-align: left;
  }

  em {
    font-style: normal;
    font-size: 0.85rem;
    font-weight: 900;
    color: #333d4b;
    text-align: right;
    white-space: nowrap;
  }

  .track {
    width: 100%;
    height: 0.4rem;
    border-radius: 999px;
    background: #eef1f5;
    overflow: hidden;
  }

  .fill {
    height: 100%;
    border-radius: 999px;
    background: ${({ $active }) => ($active ? "#3182f6" : "#c3ccd6")};
  }

  @media (max-width: 760px) {
    grid-template-columns: 2rem 2.6rem minmax(40px, 1fr) 5.5rem;
    gap: 0.5rem;

    em {
      font-size: 0.78rem;
    }
  }
`;

export const StCategoryList = styled.div`
  margin-top: 0.6rem;
  display: grid;
  gap: 0;
`;

export const StCategoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  border-top: 1px solid #eef0f2;
  padding: 0.72rem 0.15rem;

  &:first-child {
    border-top: none;
  }

  div {
    display: grid;
    gap: 0.18rem;
  }

  strong {
    font-size: 0.84rem;
    color: ${({ theme }) => theme.colors.gray800};
    font-weight: 900;
  }

  span {
    font-size: 0.74rem;
    color: #858a91;
    font-weight: 700;
  }

  em {
    font-style: normal;
    white-space: nowrap;
    color: #333d4b;
    font-weight: 900;
  }
`;

export const StCatSummaryList = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 0.6rem;
`;

export const StCatGroup = styled.div`
  border-top: 1px solid #eef0f2;

  &:first-child {
    border-top: none;
  }
`;

export const StCatButton = styled.button<{ $active?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  border: 1px solid ${({ $active }) => ($active ? "#f5c451" : "transparent")};
  border-radius: 12px;
  background: ${({ $active }) => ($active ? "#fdf6e3" : "transparent")};
  padding: 0.78rem 0.5rem;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
`;

export const StCatMain = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  min-width: 0;

  strong {
    font-size: 0.9rem;
    font-weight: 800;
    color: #2b3441;
  }

  span {
    font-size: 0.74rem;
    color: #98a0ab;
    font-weight: 700;
  }
`;

export const StCatRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;

  em {
    font-style: normal;
    font-size: 0.92rem;
    font-weight: 900;
    color: #333d4b;
    white-space: nowrap;
  }
`;

export const StCatChevron = styled.span<{ $open: boolean }>`
  display: inline-flex;
  align-items: center;
  font-size: 1.15rem;
  color: #a2a6ad;
  transition: transform 0.18s ease;
  transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});
`;

export const StCatItems = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 0.15rem 0.6rem;
`;

export const StCatItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.42rem 0;
  border-top: 1px dashed #eef0f2;

  div {
    min-width: 0;
    display: grid;
    gap: 0.12rem;
  }

  strong {
    font-size: 0.82rem;
    font-weight: 700;
    color: #3a3f47;
  }

  span {
    font-size: 0.72rem;
    color: #98a0ab;
  }

  em {
    font-style: normal;
    font-size: 0.82rem;
    font-weight: 800;
    color: #4e5560;
    white-space: nowrap;
  }
`;

export const StEmpty = styled.p`
  margin-top: 0.85rem;
  font-size: 0.84rem;
  color: #90949b;
`;
