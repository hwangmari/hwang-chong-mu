"use client";

import styled from "styled-components";

/* 근육 도감 전용 스타일 (2026-09-21).
   규칙 두 가지만 지킨다.
   1) 테두리는 한 단계에 하나 — 카드가 테두리를 갖고, 안쪽은 여백과 semantic.bg 띠로만 나눈다.
   2) 한 줄에 있는 것은 줄을 맞춘다 — 이름과 영어 이름이 같은 x 에서 시작한다. */

/* 넓은 화면은 그림 6 : 목록 4 두 칸, 좁은 화면은 그림이 위로 (주인 요청 2026-09-21) */
export const StPicker = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  align-items: start;

  /* 주인 창(945px)에서도 두 칸이 되도록 이 화면만 900px 부터 나눈다 (2026-09-21) */
  @media (min-width: 900px) {
    grid-template-columns: minmax(0, 6fr) minmax(0, 4fr);
    gap: 1.25rem;
  }
`;

/* 그림 칸 — 목록을 내려 봐도 그림은 따라온다 */
export const StBodyCol = styled.div`
  @media (min-width: 900px) {
    position: sticky;
    top: 4.5rem;
  }
`;

export const StListCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
`;

export const StTop = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

/* ===== 몸 그림 ===== */

export const StBodyBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.625rem;
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.white};
`;

/* 그림 위 줄 — 앞/뒤 토글과 "전체 보기" */
export const StBodyHead = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
  width: 100%;
`;

/* "전체 보기" 를 오른쪽 끝으로 밀어 주는 빈 칸 */
export const StBodySpacer = styled.span`
  flex: 1;
`;

export const StBodyReset = styled.button`
  border: 0;
  background: none;
  padding: 0 0.25rem;
  font-size: 0.8rem;
  font-weight: 700;
  font-family: inherit;
  color: ${({ theme }) => theme.semantic.primary};
  cursor: pointer;
`;

/* 보기 고르기 — 몸(앞·옆·뒤)과 발(발바닥·발등)을 두 묶음으로 나눈다.
   한 묶음에 2~4칸만 두는 규칙을 지키려고 다섯 칸을 쪼갰다 (검토 반영 2026-09-21) */
export const StBodySwitch = styled.div`
  display: inline-flex;
  padding: 0.1875rem;
  border-radius: 0.625rem;
  background: ${({ theme }) => theme.semantic.bg};
`;

export const StBodySwitchButton = styled.button<{ $active: boolean }>`
  height: 1.875rem;
  padding: 0 0.75rem;
  border: 0;
  border-radius: 0.5rem;
  background: ${({ $active, theme }) => ($active ? theme.colors.white : "transparent")};
  color: ${({ $active, theme }) => ($active ? theme.semantic.text : theme.semantic.subText)};
  box-shadow: ${({ $active }) => ($active ? "0 1px 2px rgba(0, 0, 0, 0.08)" : "none")};
  font-size: 0.82rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
`;

export const StBodyFigure = styled.svg`
  /* 칸을 가득 채우되 세로로 너무 길어지지 않게 — 확대하면 viewBox 비율이 바뀌므로 높이로 잡는다 */
  width: 100%;
  height: min(78vh, 720px);
  font-size: 11px;

  @media ${({ theme }) => theme.media.mobile} {
    height: min(62vh, 460px);
  }

  /* 주인 그림 원본 — 근육 칸은 이 위에 얹힌다 */
  .art {
    pointer-events: none;
  }

  /* 근육 칸 — 평소엔 아주 옅게 칠해 모양이 보이고, 손을 올리거나 고르면 진해진다 */
  .spot {
    cursor: pointer;
  }

  .spot path,
  .spot ellipse {
    fill: rgba(201, 88, 76, 0.1);
    stroke: rgba(201, 88, 76, 0.35);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
    mix-blend-mode: multiply;
    transition: fill 0.15s ease;
  }

  .spot.hover path,
  .spot.hover ellipse {
    fill: rgba(201, 88, 76, 0.32);
    stroke: rgba(170, 60, 50, 0.85);
  }

  /* 고른 근육 — 속을 옅게 칠하고 테두리를 또렷하게: 그림의 근육 결·선이 비쳐 보이게 (주인 요청 2026-09-22) */
  .spot.on path,
  .spot.on ellipse {
    fill: rgba(37, 99, 235, 0.3);
    stroke: rgba(29, 78, 216, 0.95);
    stroke-width: 1.6;
  }

  /* 갈래 사이 경계선 — 평소엔 안 보이고, 손을 올리거나 고르면 진하게 */
  .spot .seam {
    fill: transparent;
    stroke: none;
  }

  .spot.hover .seam {
    fill: rgba(150, 45, 36, 0.75);
  }

  .spot.on .seam {
    fill: rgba(29, 78, 216, 0.9);
  }

  /* 확대 중 다른 부위 — 흐리게 두되 누를 수 있고, 올리면 조금 진해진다 */
  .spot.dim {
    opacity: 0.25;
    transition: opacity 0.15s ease;
  }

  .spot.dim.hover {
    opacity: 0.75;
  }

  .spot:focus {
    outline: none;
  }

  .spot:focus-visible path,
  .spot:focus-visible ellipse {
    fill: rgba(37, 99, 235, 0.35);
  }

  @media (prefers-reduced-motion: reduce) {
    .spot path,
    .spot ellipse {
      transition: none;
    }
  }

  /* 이름표가 가리키는 점 */
  .dot {
    fill: ${({ theme }) => theme.semantic.primary};
    opacity: 0.55;
  }

  .label.hover .dot,
  .label.on .dot {
    opacity: 1;
  }

  /* 이름표와 점선 */
  .label {
    cursor: pointer;
  }

  .label text {
    fill: ${({ theme }) => theme.semantic.text};
    font-weight: 700;
    font-size: inherit;
    /* 그림 위에 글자가 겹쳐도 읽히게 흰 테두리를 두른다 */
    paint-order: stroke;
    stroke: ${({ theme }) => theme.colors.white};
    stroke-width: 4px;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }

  .label.hover text,
  .label.on text {
    fill: ${({ theme }) => theme.semantic.primary};
  }

  .leader {
    fill: none;
    stroke: ${({ theme }) => theme.semantic.border};
    stroke-width: 1;
    stroke-dasharray: 3 3;
    vector-effect: non-scaling-stroke;
  }

  .label.hover .leader,
  .label.on .leader {
    stroke: ${({ theme }) => theme.semantic.primary};
  }
`;

export const StBodyCaption = styled.p`
  font-size: 0.82rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
`;

/* 검색 칸 — 조작이라 테두리를 지킨다 */
export const StSearch = styled.input`
  width: 100%;
  height: 2.75rem;
  padding: 0 0.875rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.semantic.text};
  font-size: 0.95rem;
  font-family: inherit;

  &::placeholder {
    color: ${({ theme }) => theme.semantic.subText};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.semantic.primary};
  }
`;

/* 부위 탭 — 글자 + 2px 밑줄. 상자를 두르지 않는다.
   부위가 11개라 한 줄에 다 안 들어간다 — 가로로 숨기지 않고 줄을 바꾼다 (검토 반영 2026-09-21) */
export const StTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0 0.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.semantic.border};
`;

export const StTab = styled.button<{ $active: boolean }>`
  position: relative;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 0.75rem;
  margin-bottom: -1px;
  border: 0;
  background: none;
  font-size: 0.9rem;
  font-weight: 800;
  font-family: inherit;
  color: ${({ $active, theme }) =>
    $active ? theme.semantic.text : theme.semantic.subText};
  cursor: pointer;
  transition: color 0.15s ease;

  /* 밑줄: 비활성은 0폭, 활성은 전체 폭 — 왼쪽에서 그어진다 */
  &::after {
    content: "";
    position: absolute;
    left: 0.625rem;
    right: 0.625rem;
    bottom: -1px;
    height: 2px;
    border-radius: 2px;
    background: ${({ theme }) => theme.semantic.primary};
    transform: scaleX(${({ $active }) => ($active ? 1 : 0)});
    transform-origin: left center;
    transition: transform 0.22s cubic-bezier(0.2, 0.7, 0.2, 1);
  }

  &:hover {
    color: ${({ theme }) => theme.semantic.text};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &::after {
      transition: none;
    }
  }
`;

export const StTabCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.semantic.primary};
  background: ${({ theme }) => theme.semantic.primaryLight};
`;

export const StCount = styled.p`
  font-size: 0.82rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
`;

/* 근육 카드 — 오른쪽 칸(4)에 들어가므로 한 줄에 하나씩 */
export const StGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.75rem;
`;

export const StCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 1.125rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.white};
`;

export const StCardHead = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.375rem 0.5rem;
`;

export const StName = styled.h3`
  font-size: 1rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
`;

export const StAlias = styled.span`
  font-size: 0.82rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
`;

export const StEn = styled.span`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.semantic.subText};
`;

/* 부위 칩 — 테두리 없이 면만 (고른 상태가 아니므로) */
export const StPartChip = styled.span`
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  height: 1.5rem;
  padding: 0 0.5rem;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.semantic.bg};
  color: ${({ theme }) => theme.semantic.subText};
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
`;

export const StWhere = styled.p`
  padding: 0.625rem 0.75rem;
  border-radius: 0.625rem;
  background: ${({ theme }) => theme.semantic.bg};
  font-size: 0.86rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.semantic.text};
`;

export const StBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

/* 갈래 목록 — 이름은 고정 폭 칸이라 설명이 같은 x 에서 시작한다 */
export const StHeads = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const StHead = styled.li`
  display: grid;
  grid-template-columns: 5.5rem minmax(0, 1fr);
  gap: 0.5rem;
  align-items: baseline;
`;

export const StHeadName = styled.span`
  display: inline-flex;
  align-items: center;
  justify-self: start;
  padding: 0.125rem 0.5rem;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.semantic.primaryLight};
  color: ${({ theme }) => theme.semantic.primary};
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
`;

export const StHeadNote = styled.span`
  font-size: 0.84rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.semantic.text};
`;

export const StLabel = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
`;

export const StList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  margin: 0;
  padding-left: 0.875rem;
  list-style: disc;

  li {
    font-size: 0.86rem;
    line-height: 1.6;
    color: ${({ theme }) => theme.semantic.text};
  }
`;

export const StText = styled.p`
  font-size: 0.86rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.semantic.text};
`;

/* 대표 운동 — 글자만큼만 차지하는 칩들 */
export const StLifts = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
`;

export const StLift = styled.span`
  display: inline-flex;
  align-items: center;
  height: 1.625rem;
  padding: 0 0.5rem;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.semantic.primaryLight};
  color: ${({ theme }) => theme.semantic.primary};
  font-size: 0.78rem;
  font-weight: 700;
`;

/* 해부학 상세 — 부위를 고르면 펼쳐지는 표. 카드가 이미 테두리를 가져서 여기는 띠로만 나눈다 */
export const StDetail = styled.dl`
  display: grid;
  grid-template-columns: 4.5rem minmax(0, 1fr);
  gap: 0.375rem 0.625rem;
  margin: 0;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.semantic.bg};

  dt {
    font-size: 0.78rem;
    font-weight: 700;
    color: ${({ theme }) => theme.semantic.subText};
  }

  dd {
    margin: 0;
    font-size: 0.84rem;
    line-height: 1.6;
    color: ${({ theme }) => theme.semantic.text};
  }
`;

export const StTip = styled.p`
  font-size: 0.82rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.semantic.subText};
`;

export const StEmpty = styled.p`
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.9rem;
  line-height: 1.7;
  color: ${({ theme }) => theme.semantic.subText};
`;

/* ===== 근육은 어떻게 생겼나 (참고 자료는 맨 아래) ===== */

export const StTissue = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 2rem;
`;

export const StTissueTitle = styled.h2`
  font-size: 1rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
`;

export const StTissueGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.75rem;

  @media ${({ theme }) => theme.media.desktop} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const StNote = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 1rem 1.125rem;
  border-radius: 1rem;
  background: ${({ theme }) => theme.semantic.bg};
`;

export const StNoteTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
`;

export const StNoteBody = styled.p`
  font-size: 0.86rem;
  line-height: 1.7;
  color: ${({ theme }) => theme.semantic.text};
`;

export const StDisclaimer = styled.p`
  margin-top: 1.25rem;
  font-size: 0.8rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.semantic.subText};
`;
