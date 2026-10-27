"use client";

import styled from "styled-components";
import type { ResolvedMatch, ScheduleBlock, TeamEntry } from "./types";
import type { Layout, Link } from "./BracketTree";

/**
 * 픽셀 대진표 — 픽셀 코트 탭 아래의 토너먼트 그림. (주인 요청 2026-10-27)
 * 승자조·패자조를 나누지 않고 한 장에 그린다 (주인 요청 2026-10-27 "안 나누고 그려 줄 수 없어?").
 *  · 열 = 시간대(1~6타임). 같은 시간에 하는 경기가 같은 세로줄에 선다
 *  · 위쪽 = 승자조, 아래쪽 = 패자조, 맨 오른쪽 = 그랜드 파이널, 맨 아래 = 순위결정전
 *  · 노란 선 = 이긴 팀이 올라가는 길, 분홍 점선 = 진 팀이 패자조로 내려가는 길
 * 팀 이름 아래에 명단 한 줄 — 토너먼트 그림과 같은 방식.
 */

// 팀 시드별 셔츠 색 — 픽셀 코트와 대진표가 같은 색을 쓴다
// 6팀은 보라 코트 위에서 묻혀 진한 남색으로 (2026-10-27)
export const SHIRT = ["#e8504a", "#f29b38", "#f2d64b", "#6cc96a", "#4cc3d9", "#2f4ab8", "#ef86c1", "#f4f1ea"];
export const shirtOf = (team: TeamEntry) => SHIRT[(team.seed - 1) % SHIRT.length];

// 명단 한 줄씩 넣으며 칸을 넓히고 높였다 (150×64 → 180×96). 한 장으로 합치며 열 사이를 넓혀
// 이긴 길(가운데)과 진 길(오른쪽 칸 바로 앞) 세로선이 겹치지 않게 했다 (2026-10-27)
const COL_W = 232;
const ROW_H = 108;
const NODE_W = 180;
const NODE_H = 96;
const PAD = 6;
const HEAD_H = 26; // 맨 위 시간대 줄

// 한 장 배치: col = 시간대 - 1, row = 세로 자리 (0.5 단위)
const ALL: Layout[] = [
  { no: 1, col: 0, row: 0 },
  { no: 2, col: 0, row: 1 },
  { no: 3, col: 0, row: 2 },
  { no: 4, col: 0, row: 3 },
  { no: 5, col: 1, row: 0.5 },
  { no: 6, col: 1, row: 2.5 },
  { no: 9, col: 2, row: 1.5 },
  { no: 7, col: 1, row: 4.3 },
  { no: 8, col: 1, row: 5.3 },
  { no: 10, col: 2, row: 4.3 },
  { no: 11, col: 2, row: 5.3 },
  { no: 13, col: 3, row: 4.8 },
  { no: 15, col: 4, row: 4.8 },
  { no: 16, col: 5, row: 3.15 },
  { no: 12, col: 2, row: 6.5 },
  { no: 14, col: 3, row: 6.5 },
];
const ALL_LINKS: Link[] = [
  { from: 1, to: 5, kind: "winner" },
  { from: 2, to: 5, kind: "winner" },
  { from: 3, to: 6, kind: "winner" },
  { from: 4, to: 6, kind: "winner" },
  { from: 5, to: 9, kind: "winner" },
  { from: 6, to: 9, kind: "winner" },
  { from: 9, to: 16, kind: "winner" },
  { from: 7, to: 10, kind: "winner" },
  { from: 8, to: 11, kind: "winner" },
  { from: 10, to: 13, kind: "winner" },
  { from: 11, to: 13, kind: "winner" },
  { from: 13, to: 15, kind: "winner" },
  { from: 15, to: 16, kind: "winner" },
  { from: 1, to: 7, kind: "loser" },
  { from: 2, to: 7, kind: "loser" },
  { from: 3, to: 8, kind: "loser" },
  { from: 4, to: 8, kind: "loser" },
  { from: 6, to: 10, kind: "loser" },
  { from: 5, to: 11, kind: "loser" },
  { from: 9, to: 15, kind: "loser" },
];
const DROP = "#ff8fb1";

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
  colHeads,
}: {
  title: string;
  hint: string;
  layout: Layout[];
  links: Link[];
  by: Map<number, ResolvedMatch>;
  colHeads: string[];
}) {
  const cols = Math.max(...layout.map((l) => l.col)) + 1;
  const rows = Math.max(...layout.map((l) => l.row)) + 1;
  const width = PAD * 2 + (cols - 1) * COL_W + NODE_W;
  const height = HEAD_H + PAD * 2 + (rows - 1) * ROW_H + NODE_H;
  const at = new Map(
    layout.map((l) => [l.no, { x: PAD + l.col * COL_W, y: HEAD_H + PAD + l.row * ROW_H }]),
  );

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
              const decided = fm.status === "done";
              if (lk.kind === "loser") {
                // 진 팀 길: 받는 칸 바로 앞에서 꺾어 내려간다 — 이긴 길 세로선(열 사이 가운데)과 겹치지 않게
                const drop = x2 - 12;
                return (
                  <path
                    key={`${lk.from}-${lk.to}-l`}
                    d={`M ${x1} ${y1 + 8} H ${drop} V ${y2 - 8} H ${x2}`}
                    fill="none"
                    stroke={DROP}
                    strokeWidth={decided ? 2 : 1}
                    strokeDasharray="3 3"
                    opacity={decided ? 1 : 0.55}
                  />
                );
              }
              const mid = Math.round(x1 + (x2 - x1) / 2);
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
          {colHeads.map((h, i) => (
            <StColHead key={h} style={{ left: PAD + i * COL_W, width: NODE_W }}>
              {h}
            </StColHead>
          ))}
          {layout.map((l) => {
            const m = by.get(l.no);
            if (!m) return null;
            const p = at.get(l.no)!;
            const done = m.status === "done";
            const row = (team: TeamEntry | null, label: string, score: number | null) => {
              const won = done && !!team && m.winner?.seed === team.seed;
              // 팀 안 시드 순서. 아직 팀이 안 정해진 칸도 같은 높이로 비워 둔다
              const names = team
                ? [...team.players].sort((a, b) => a.seed - b.seed).map((p) => p.name).filter((n) => n.trim())
                : [];
              return (
                <div>
                  <StRow $won={won} $lost={done && !won} $empty={!team}>
                    <StSwatch style={{ background: team ? shirtOf(team) : "transparent" }} />
                    <StName>{team ? team.name : label}</StName>
                    <StPts>{score ?? ""}</StPts>
                  </StRow>
                  <StRoster title={names.join(" · ") || undefined}>
                    {names.length ? names.join("·") : " "}
                  </StRoster>
                </div>
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

export default function PixelBracket({
  matches,
  blocks,
}: {
  matches: ResolvedMatch[];
  blocks: ScheduleBlock[];
}) {
  const by = new Map(matches.map((m) => [m.template.no, m]));
  const heads = blocks.map((b) => `${b.no}타임 · ${b.time.split(" — ")[0]}`);
  return (
    <StWrap>
      <Tree
        title="한 장 대진표"
        hint="위 승자조 · 아래 패자조 · 노란 선 이긴 길 · 분홍 점선 진 팀이 내려가는 길"
        layout={ALL}
        links={ALL_LINKS}
        by={by}
        colHeads={heads}
      />
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

const StColHead = styled.div`
  position: absolute;
  top: 0;
  height: ${HEAD_H - 6}px;
  display: grid;
  place-items: center;
  font-family: ${PIX};
  font-size: 0.68rem;
  font-weight: 800;
  color: #121b20;
  background: ${LED};
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

const StRoster = styled.div`
  padding-left: 13px;
  font-size: 0.6rem;
  font-weight: 500;
  color: ${DIM};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StPts = styled.span`
  font-family: ${PIX};
  text-align: right;
  font-variant-numeric: tabular-nums;
`;
