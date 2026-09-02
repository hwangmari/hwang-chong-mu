"use client";

import type React from "react";
import { STAGE_COLOR, type ResolvedMatch, type TeamEntry } from "./types";
import { DOUBLE_ELIM_8 } from "./template";
import { StCardHint, StNode, StNodeHead, StNodeTeam } from "../page.styles";

// 진짜 대진표 모양: 앞 경기 두 개 사이에 다음 경기 칸이 오고, 이긴 팀의 경로가 선으로 이어진다
type Props = { matches: ResolvedMatch[] };

type Layout = { no: number; col: number; row: number }; // row는 0.5 단위 가능
type Link = { from: number; to: number; kind: "winner" | "loser" };

const COL_W = 250; // 열 간격
const ROW_H = 104; // 행 간격
const NODE_W = 210;
const NODE_H = 104;
const PAD = 12;

// 승자조: 1라운드 4 → 4강 2 → 결승 → 그랜드 파이널 → (리셋)
const WB: Layout[] = [
  { no: 1, col: 0, row: 0 }, { no: 2, col: 0, row: 1 }, { no: 3, col: 0, row: 2 }, { no: 4, col: 0, row: 3 },
  { no: 5, col: 1, row: 0.5 }, { no: 6, col: 1, row: 2.5 },
  { no: 9, col: 2, row: 1.5 },
  { no: 16, col: 3, row: 1.5 },
  { no: 18, col: 4, row: 1.5 },
];
const WB_LINKS: Link[] = [
  { from: 1, to: 5, kind: "winner" }, { from: 2, to: 5, kind: "winner" },
  { from: 3, to: 6, kind: "winner" }, { from: 4, to: 6, kind: "winner" },
  { from: 5, to: 9, kind: "winner" }, { from: 6, to: 9, kind: "winner" },
  { from: 9, to: 16, kind: "winner" },
  { from: 16, to: 18, kind: "winner" },
];
// 패자조: 1R 2 → 2R 2 → 준결승 → 결승 → (그랜드 파이널로)
const LB: Layout[] = [
  { no: 7, col: 0, row: 0 }, { no: 8, col: 0, row: 1 },
  { no: 10, col: 1, row: 0 }, { no: 11, col: 1, row: 1 },
  { no: 13, col: 2, row: 0.5 },
  { no: 15, col: 3, row: 0.5 },
];
const LB_LINKS: Link[] = [
  { from: 7, to: 10, kind: "winner" }, { from: 8, to: 11, kind: "winner" },
  { from: 10, to: 13, kind: "winner" }, { from: 11, to: 13, kind: "winner" },
  { from: 13, to: 15, kind: "winner" },
];
// 순위결정전: 각각 독립
const PLACE: Layout[] = [
  { no: 12, col: 0, row: 0 }, { no: 14, col: 1, row: 0 }, { no: 17, col: 2, row: 0 },
];

// 다른 트리에서 내려오는 팀(승자조 패자 등)은 칸 위에 짧은 화살표 글로 표시
const DROP_IN: Record<number, string[]> = {
  7: ["1라운드 1번 패자 ↓", "1라운드 2번 패자 ↓"],
  8: ["1라운드 3번 패자 ↓", "1라운드 4번 패자 ↓"],
  10: ["승자조 4강 6번 패자 ↓"],
  11: ["승자조 4강 5번 패자 ↓"],
  15: ["승자조 결승 9번 패자 ↓"],
  16: ["패자조 결승 15번 승자 ↑"],
  12: ["패자조 1R 7·8번 패자 ↓"],
  14: ["패자조 2R 10·11번 패자 ↓"],
  17: ["패자조 준결승 13번 패자 · 패자조 결승 15번 패자 ↓"],
};

function pos(l: Layout) {
  return { x: PAD + l.col * COL_W, y: PAD + l.row * ROW_H + 18 };
}

// 이 경기의 승자/패자가 어디로 가는지 (템플릿에서 역으로 찾는다)
function destinations(no: number) {
  const win = DOUBLE_ELIM_8.find((m) => (m.a.kind === "winner" && m.a.of === no) || (m.b.kind === "winner" && m.b.of === no));
  const lose = DOUBLE_ELIM_8.find((m) => (m.a.kind === "loser" && m.a.of === no) || (m.b.kind === "loser" && m.b.of === no));
  const text = (m: typeof win) => (m ? { short: `${m.no}번`, full: `${m.no}번 ${m.label}` } : null);
  return { win: text(win), lose: text(lose) };
}

const RESULT_BADGE: React.CSSProperties = {
  display: "inline-block",
  minWidth: "1.3rem",
  textAlign: "center",
  fontSize: "0.62rem",
  fontWeight: 900,
  padding: "0 0.3rem",
  borderRadius: "999px",
  marginRight: "0.3rem",
  color: "#fff",
};

function teamLine(team: TeamEntry | null, label: string, score: number | null, result: "win" | "loss" | null) {
  return (
    <StNodeTeam $winner={result === "win"} $empty={!team}>
      <span className="name">
        {result ? (
          <span style={{ ...RESULT_BADGE, background: result === "win" ? "#1f8a54" : "#c0304f" }}>
            {result === "win" ? "승" : "패"}
          </span>
        ) : null}
        {team ? `#${team.seed} ${team.name}` : label}
      </span>
      <span className="score">{score !== null ? score : ""}</span>
    </StNodeTeam>
  );
}

function Tree({
  title,
  hint,
  color,
  layout,
  links,
  by,
}: {
  title: string;
  hint: string;
  color: string;
  layout: Layout[];
  links: Link[];
  by: Map<number, ResolvedMatch>;
}) {
  const cols = Math.max(...layout.map((l) => l.col)) + 1;
  const rows = Math.max(...layout.map((l) => l.row)) + 1;
  const width = PAD * 2 + (cols - 1) * COL_W + NODE_W;
  const height = PAD * 2 + 18 + (rows - 1) * ROW_H + NODE_H + 8;
  const at = new Map(layout.map((l) => [l.no, pos(l)]));

  return (
    <div style={{ marginBottom: "1.4rem" }}>
      <div style={{ fontSize: "0.8rem", fontWeight: 900, color, marginBottom: "0.3rem" }}>
        {title} <em style={{ fontStyle: "normal", fontWeight: 600, color: "#94a3b8" }}>· {hint}</em>
      </div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ position: "relative", width, height, minWidth: width }}>
          <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
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
              const mid = x1 + (x2 - x1) / 2;
              const decided = fm.status === "done"; // 이긴 팀이 정해져 올라간 선
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
          {layout.map((l) => {
            const m = by.get(l.no);
            if (!m) return null;
            const p = at.get(l.no)!;
            const done = m.status === "done";
            const winnerA = done && m.winner?.seed === m.teamA?.seed && m.teamA !== null;
            const winnerB = done && m.winner?.seed === m.teamB?.seed && m.teamB !== null;
            const resultA = done ? (winnerA ? "win" : "loss") : null;
            const resultB = done ? (winnerB ? "win" : "loss") : null;
            const drops = DROP_IN[l.no] ?? [];
            const dest = destinations(l.no);
            const finalNode = l.no === 16 || l.no === 18;
            return (
              <div key={l.no} style={{ position: "absolute", left: p.x, top: p.y - 18, width: NODE_W }}>
                {drops.length > 0 ? (
                  <div style={{ fontSize: "0.62rem", color: "#be123c", fontWeight: 800, height: 18, lineHeight: "18px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {drops.join(" · ")}
                  </div>
                ) : (
                  <div style={{ height: 18 }} />
                )}
                <StNode $color={STAGE_COLOR[m.template.stage]} $state={m.status} style={{ height: NODE_H, boxSizing: "border-box" }}>
                  <StNodeHead>
                    <span>
                      {m.template.no}번 · {m.template.label}
                    </span>
                    <span>
                      {m.status === "done" ? "완료" : m.status === "playing" ? "진행 중" : m.status === "ready" ? "시작 가능" : m.status === "hidden" ? "조건부" : `${m.template.block}타임`}
                    </span>
                  </StNodeHead>
                  {teamLine(m.teamA, m.aLabel, m.scoreA, resultA)}
                  {teamLine(m.teamB, m.bLabel, m.scoreB, resultB)}
                  <div style={{ display: "flex", gap: "0.4rem", fontSize: "0.6rem", fontWeight: 700, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden" }}>
                    {finalNode ? (
                      <span>🏆 {l.no === 16 ? "이기면 우승 · 패자조 출신이 이기면 리셋" : "이기면 우승"}</span>
                    ) : (
                      <>
                        {dest.win ? (
                          <span style={{ color: "#1f8a54" }} title={`이기면 ${dest.win.full}으로`}>
                            이기면 → {dest.win.short}
                          </span>
                        ) : null}
                        {dest.lose ? (
                          <span style={{ color: "#c0304f" }} title={`지면 ${dest.lose.full}으로`}>
                            지면 → {dest.lose.short}
                          </span>
                        ) : (
                          <span style={{ color: "#c0304f" }}>지면 → 탈락</span>
                        )}
                      </>
                    )}
                  </div>
                </StNode>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function BracketTree({ matches }: Props) {
  const by = new Map(matches.map((m) => [m.template.no, m]));
  return (
    <>
      <Tree title="승자조" hint="이기면 오른쪽 칸으로 올라가요 (진한 선). 지면 패자조로 내려가요" color="#1d4ed8" layout={WB} links={WB_LINKS} by={by} />
      <Tree title="패자조" hint="여기서 지면 두 번째 패배 → 순위결정전. 끝까지 이기면 그랜드 파이널로" color="#be123c" layout={LB} links={LB_LINKS} by={by} />
      <Tree title="순위결정전" hint="7-8위 · 5-6위 · 3-4위를 정해요" color="#64748b" layout={PLACE} links={[]} by={by} />
      <StCardHint>
        진한 파란 선은 이미 결과가 나와 이긴 팀이 올라간 길이고, 점선은 아직이에요. 칸 위의 빨간 글은 다른 트리에서 내려오는 팀이에요.
        리셋 재경기는 패자조 출신이 그랜드 파이널을 이겼을 때만 열려서 그전엔 흐리게 보여요. 화면이 좁으면 옆으로 밀어서 보세요.
      </StCardHint>
    </>
  );
}
