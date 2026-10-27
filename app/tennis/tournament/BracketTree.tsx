"use client";

import type React from "react";
import {
  STAGE_COLOR,
  type ResolvedMatch,
  type ScheduleBlock,
  type TeamEntry,
} from "./types";
import {
  StCardHint,
  StNode,
  StNodeHead,
  StNodeRoster,
  StNodeTeam,
} from "../page.styles";

// 진짜 대진표 모양: 앞 경기 두 개 사이에 다음 경기 칸이 오고, 이긴 팀의 경로가 선으로 이어진다
// 칸 타입(Layout·Link)은 픽셀 대진표(PixelBracket)도 같이 쓴다
type Props = { matches: ResolvedMatch[]; blocks: ScheduleBlock[] };

export type Layout = { no: number; col: number; row: number }; // row는 0.5 단위 가능
export type Link = { from: number; to: number; kind: "winner" | "loser" };

const COL_W = 274; // 열 간격 (한 장으로 합치며 이긴 길·진 길 세로선이 안 겹치게 250 → 274)
const ROW_H = 136; // 행 간격 (팀 아래 명단 한 줄씩 넣으며 104 → 136, 2026-10-27)
const NODE_W = 210;
const NODE_H = 116;
const PAD = 12;

// 승자조·패자조·순위결정전을 한 장에 (주인 요청 2026-10-27 — 픽셀 대진표처럼 "안 나누고").
//  · col = 라운드(시간대) - 1. 같은 시간에 하는 경기가 같은 세로줄에 선다
//  · 위 = 승자조, 아래 = 패자조, 맨 오른쪽 = 그랜드 파이널, 맨 아래 = 순위결정전
//  · winner 선 = 이긴 팀이 올라가는 길, loser 선 = 진 팀이 패자조로 내려가는 길
// 픽셀 코트 탭의 픽셀 대진표(PixelBracket)도 이 배치를 그대로 쓴다.
export const ONE_SHEET: Layout[] = [
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
export const ONE_SHEET_LINKS: Link[] = [
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

/** 맨 위 라운드 줄 글자: "1라운드 · 13:00" */
export function roundHeads(blocks: ScheduleBlock[]) {
  return blocks.map((b) => `${b.no}라운드 · ${b.time.split(" — ")[0]}`);
}

const HEAD_H = 30;

function pos(l: Layout) {
  return { x: PAD + l.col * COL_W, y: HEAD_H + PAD + l.row * ROW_H };
}

const RESULT_BADGE: React.CSSProperties = {
  display: "inline-block",
  minWidth: "1.3rem",
  textAlign: "center",
  fontSize: "0.62rem",
  fontWeight: 900,
  padding: "0 0.3rem",
  borderRadius: "999px",
  color: "#fff",
};

// 팀 이름 아래 작은 명단 한 줄 — 팀 안 시드 순서. 아직 팀이 안 정해진 칸도 같은 높이로 비워 둔다
function roster(team: TeamEntry | null) {
  const names = team
    ? [...team.players].sort((a, b) => a.seed - b.seed).map((p) => p.name)
    : [];
  return (
    <StNodeRoster title={names.join(" · ") || undefined}>
      {names.length ? names.join(" · ") : "\u00a0"}
    </StNodeRoster>
  );
}

function teamLine(
  team: TeamEntry | null,
  label: string,
  score: number | null,
  result: "win" | "loss" | null,
) {
  return (
    <div>
      <StNodeTeam $winner={result === "win"} $empty={!team}>
        <span className="name">
          {team ? `#${team.seed} ${team.name}` : label}
        </span>
        <span
          className="score"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
          }}
        >
          {score !== null ? score : ""}
          {result === "win" ? (
            <span style={{ ...RESULT_BADGE, background: "#1f8a54" }}>승</span>
          ) : null}
        </span>
      </StNodeTeam>
      {roster(team)}
    </div>
  );
}

function Tree({
  title,
  hint,
  color,
  layout,
  links,
  by,
  colHeads,
}: {
  title: string;
  hint: string;
  color: string;
  layout: Layout[];
  links: Link[];
  by: Map<number, ResolvedMatch>;
  colHeads: string[];
}) {
  const cols = Math.max(...layout.map((l) => l.col)) + 1;
  const rows = Math.max(...layout.map((l) => l.row)) + 1;
  const width = PAD * 2 + (cols - 1) * COL_W + NODE_W;
  const height = HEAD_H + PAD * 2 + (rows - 1) * ROW_H + NODE_H + 8;
  const at = new Map(layout.map((l) => [l.no, pos(l)]));

  return (
    <div style={{ marginBottom: "1.4rem" }}>
      <div
        style={{
          fontSize: "0.8rem",
          fontWeight: 900,
          color,
          marginBottom: "0.3rem",
        }}
      >
        {title}{" "}
        <em style={{ fontStyle: "normal", fontWeight: 600, color: "#94a3b8" }}>
          · {hint}
        </em>
      </div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ position: "relative", width, height, minWidth: width }}>
          <svg
            width={width}
            height={height}
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            {links.map((lk) => {
              const from = at.get(lk.from);
              const to = at.get(lk.to);
              const fm = by.get(lk.from);
              const tm = by.get(lk.to);
              if (!from || !to || !fm || !tm) return null;
              if (tm.status === "hidden") return null;
              const x1 = from.x + NODE_W;
              const y1 = from.y + NODE_H / 2;
              const x2 = to.x;
              const y2 = to.y + NODE_H / 2;
              const decided = fm.status === "done"; // 결과가 나와 팀이 옮겨 간 선
              if (lk.kind === "loser") {
                // 진 팀 길: 받는 칸 바로 앞에서 꺾어 내려간다 — 이긴 길 세로선(열 사이 가운데)과 안 겹치게
                const drop = x2 - 12;
                return (
                  <path
                    key={`${lk.from}-${lk.to}-l`}
                    d={`M ${x1} ${y1 + 10} H ${drop} V ${y2 - 10} H ${x2}`}
                    fill="none"
                    stroke="#be123c"
                    strokeWidth={decided ? 2 : 1.5}
                    strokeDasharray="4 4"
                    opacity={decided ? 0.9 : 0.4}
                  />
                );
              }
              const mid = x1 + (x2 - x1) / 2;
              return (
                <path
                  key={`${lk.from}-${lk.to}`}
                  d={`M ${x1} ${y1} H ${mid} V ${y2} H ${x2}`}
                  fill="none"
                  stroke={decided ? "#1d4ed8" : "#cbd5e1"}
                  strokeWidth={decided ? 3 : 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={decided ? undefined : "6 5"}
                />
              );
            })}
          </svg>
          {colHeads.map((h, i) => (
            <div
              key={h}
              style={{
                position: "absolute",
                top: 0,
                left: PAD + i * COL_W,
                width: NODE_W,
                height: HEAD_H - 8,
                display: "grid",
                placeItems: "center",
                borderRadius: "999px",
                fontSize: "0.72rem",
                fontWeight: 800,
                color: "#fff",
                background: "#1e3a8a",
              }}
            >
              {h}
            </div>
          ))}
          {layout.map((l) => {
            const m = by.get(l.no);
            if (!m) return null;
            const p = at.get(l.no)!;
            const done = m.status === "done";
            const winnerA =
              done && m.winner?.seed === m.teamA?.seed && m.teamA !== null;
            const winnerB =
              done && m.winner?.seed === m.teamB?.seed && m.teamB !== null;
            const resultA = done ? (winnerA ? "win" : "loss") : null;
            const resultB = done ? (winnerB ? "win" : "loss") : null;

            return (
              <div
                key={l.no}
                style={{
                  position: "absolute",
                  left: p.x,
                  top: p.y,
                  width: NODE_W,
                }}
              >
                <StNode
                  $color={STAGE_COLOR[m.template.stage]}
                  $state={m.status}
                  style={{ height: NODE_H, boxSizing: "border-box" }}
                >
                  <StNodeHead>
                    <span>
                      {m.template.no}번 · {m.template.label}
                    </span>
                    <span>
                      {m.status === "done"
                        ? "완료"
                        : m.status === "playing"
                          ? "진행 중"
                          : m.status === "ready"
                            ? "시작 가능"
                            : m.status === "hidden"
                              ? "조건부"
                              : `${m.template.block}타임`}
                    </span>
                  </StNodeHead>
                  {teamLine(m.teamA, m.aLabel, m.scoreA, resultA)}
                  {teamLine(m.teamB, m.bLabel, m.scoreB, resultB)}
                </StNode>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function BracketTree({ matches, blocks }: Props) {
  const by = new Map(matches.map((m) => [m.template.no, m]));
  return (
    <>
      <Tree
        title="한 장 대진표"
        hint="위 승자조 · 아래 패자조 · 맨 오른쪽 그랜드 파이널 · 맨 아래 순위결정전"
        color="#1d4ed8"
        layout={ONE_SHEET}
        links={ONE_SHEET_LINKS}
        by={by}
        colHeads={roundHeads(blocks)}
      />
      <StCardHint>
        진한 파란 선은 이긴 팀이 올라간 길, 빨간 점선은 진 팀이 패자조로
        내려가는 길이에요(결과가 나오면 진해져요). 같은 세로줄은 같은 라운드에
        동시에 하는 경기예요. 그랜드 파이널 한 판으로 1·2위가 정해지고, 3위는
        패자조 결승에서 진 팀, 4위는 패자조 준결승에서 진 팀이에요. 화면이
        좁으면 옆으로 밀어서 보세요.
      </StCardHint>
    </>
  );
}
