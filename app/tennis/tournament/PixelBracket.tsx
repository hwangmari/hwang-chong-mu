"use client";

import styled from "styled-components";
import type { ResolvedMatch, TeamEntry } from "./types";
import { LB, LB_LINKS, PLACE, WB, WB_LINKS, type Layout, type Link } from "./BracketTree";

/**
 * 픽셀 대진표 — 픽셀 코트 탭 아래의 토너먼트 그림. (주인 요청 2026-10-27)
 * 칸 배치는 토너먼트 그림(BracketTree)과 같은 WB·LB·PLACE를 쓰고, 모양만 픽셀 전광판처럼 그린다.
 * 칸이 작아 명단은 빼고 팀·점수만 둔다 — 명단은 토너먼트 그림 탭에 있다.
 */

// 팀 시드별 셔츠 색 — 픽셀 코트와 대진표가 같은 색을 쓴다
export const SHIRT = ["#e8504a", "#f29b38", "#f2d64b", "#6cc96a", "#4cc3d9", "#9b7bea", "#ef86c1", "#f4f1ea"];
export const shirtOf = (team: TeamEntry) => SHIRT[(team.seed - 1) % SHIRT.length];

const COL_W = 176;
const ROW_H = 76;
const NODE_W = 150;
const NODE_H = 64;
const PAD = 6;

const PIX = "ui-monospace, Menlo, Consolas, monospace";
const LED = "#ffcf4a";
const DIM = "#a9b8b9";
const LINE_OFF = "#4d5f68";

const STATE_EDGE: Record<ResolvedMatch["status"], string> = {
  playing: "#ff6b57",
  ready: LED,
  done: "#7ad3a0",
  waiting: "#3e5059",
  hidden: "#2f3f47",
};
const STATE_TEXT: Record<ResolvedMatch["status"], string> = {
  playing: "경기 중",
  ready: "시작 가능",
  done: "끝",
  waiting: "",
  hidden: "조건부",
};

function Tree({
  title,
  hint,
  layout,
  links,
  by,
}: {
  title: string;
  hint: string;
  layout: Layout[];
  links: Link[];
  by: Map<number, ResolvedMatch>;
}) {
  const cols = Math.max(...layout.map((l) => l.col)) + 1;
  const rows = Math.max(...layout.map((l) => l.row)) + 1;
  const width = PAD * 2 + (cols - 1) * COL_W + NODE_W;
  const height = PAD * 2 + (rows - 1) * ROW_H + NODE_H;
  const at = new Map(layout.map((l) => [l.no, { x: PAD + l.col * COL_W, y: PAD + l.row * ROW_H }]));

  return (
    <StTree>
      <StTreeTitle>
        {title} <span>{hint}</span>
      </StTreeTitle>
      <StScroll>
        <StBoard style={{ width, height }}>
          <svg width={width} height={height} shapeRendering="crispEdges" aria-hidden="true">
            {links.map((lk) => {
              const from = at.get(lk.from);
              const to = at.get(lk.to);
              const fm = by.get(lk.from);
              const tm = by.get(lk.to);
              if (!from || !to || !fm || !tm || tm.status === "hidden") return null;
              const x1 = from.x + NODE_W;
              const y1 = Math.round(from.y + NODE_H / 2);
              const x2 = to.x;
              const y2 = Math.round(to.y + NODE_H / 2);
              const mid = Math.round(x1 + (x2 - x1) / 2);
              const decided = fm.status === "done";
              return (
                <path
                  key={`${lk.from}-${lk.to}`}
                  d={`M ${x1} ${y1} H ${mid} V ${y2} H ${x2}`}
                  fill="none"
                  stroke={decided ? LED : LINE_OFF}
                  strokeWidth={decided ? 4 : 2}
                  strokeDasharray={decided ? undefined : "4 4"}
                />
              );
            })}
          </svg>
          {layout.map((l) => {
            const m = by.get(l.no);
            if (!m) return null;
            const p = at.get(l.no)!;
            const done = m.status === "done";
            const row = (team: TeamEntry | null, label: string, score: number | null) => {
              const won = done && !!team && m.winner?.seed === team.seed;
              return (
                <StRow $won={won} $lost={done && !won} $empty={!team}>
                  <StSwatch style={{ background: team ? shirtOf(team) : "transparent" }} />
                  <StName>{team ? team.name : label}</StName>
                  <StPts>{score ?? ""}</StPts>
                </StRow>
              );
            };
            return (
              <StNode
                key={l.no}
                style={{ left: p.x, top: p.y, borderColor: STATE_EDGE[m.status] }}
                $dim={m.status === "hidden"}
              >
                <StHead>
                  <span>
                    {m.template.no} · {m.template.label}
                  </span>
                  <span>{STATE_TEXT[m.status] || `${m.template.block}타임`}</span>
                </StHead>
                {row(m.teamA, m.aLabel, m.scoreA)}
                {row(m.teamB, m.bLabel, m.scoreB)}
              </StNode>
            );
          })}
        </StBoard>
      </StScroll>
    </StTree>
  );
}

export default function PixelBracket({ matches }: { matches: ResolvedMatch[] }) {
  const by = new Map(matches.map((m) => [m.template.no, m]));
  return (
    <StWrap>
      <Tree title="승자조" hint="이기면 오른쪽으로 · 노란 선이 올라간 길" layout={WB} links={WB_LINKS} by={by} />
      <Tree title="패자조" hint="한 번 진 팀 · 끝까지 이기면 그랜드 파이널" layout={LB} links={LB_LINKS} by={by} />
      <Tree title="순위결정전" hint="7-8위 · 5-6위" layout={PLACE} links={[]} by={by} />
    </StWrap>
  );
}

const StWrap = styled.div`
  display: grid;
  gap: 1rem;
`;

const StTree = styled.div`
  display: grid;
  gap: 0.4rem;
  min-width: 0;
`;

const StTreeTitle = styled.div`
  font-family: ${PIX};
  font-size: 0.82rem;
  font-weight: 800;
  color: ${LED};

  span {
    font-family: inherit;
    font-size: 0.72rem;
    font-weight: 600;
    color: ${DIM};
  }
`;

const StScroll = styled.div`
  overflow-x: auto;
`;

const StBoard = styled.div`
  position: relative;

  svg {
    position: absolute;
    inset: 0;
  }
`;

const StNode = styled.div<{ $dim: boolean }>`
  position: absolute;
  width: ${NODE_W}px;
  height: ${NODE_H}px;
  display: grid;
  grid-template-rows: auto 1fr 1fr;
  padding: 3px 6px;
  background: #121b20;
  border: 2px solid;
  box-shadow: 3px 3px 0 #0007;
  opacity: ${({ $dim }) => ($dim ? 0.55 : 1)};
`;

const StHead = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 4px;
  font-family: ${PIX};
  font-size: 0.6rem;
  color: ${DIM};
  white-space: nowrap;
  overflow: hidden;
`;

const StRow = styled.div<{ $won: boolean; $lost: boolean; $empty: boolean }>`
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) 1.4rem;
  align-items: center;
  gap: 5px;
  font-size: 0.74rem;
  font-weight: ${({ $won }) => ($won ? 900 : 700)};
  color: ${({ $won, $lost, $empty }) => ($won ? LED : $lost || $empty ? "#7d8c8e" : "#f3ead6")};
`;

const StSwatch = styled.i`
  width: 8px;
  height: 8px;
`;

const StName = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StPts = styled.span`
  font-family: ${PIX};
  text-align: right;
  font-variant-numeric: tabular-nums;
`;
