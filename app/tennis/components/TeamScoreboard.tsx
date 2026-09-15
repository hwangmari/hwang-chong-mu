"use client";

import styled from "styled-components";
import { outcomeForA } from "../standings";
import type { MatchScore, Player, ScoreMap, TennisEvent } from "../types";
import { StCard, StCardHead, StCardHint, StCardTitle } from "../page.styles";

// 팀 대항(A팀 vs B팀) 교류전의 팀 승패 집계. 선수에 team 값이 정확히 두 종류일 때만 그린다.
type Props = { event: TennisEvent; scores: ScoreMap; players: Map<string, Player> };

type Tally = { name: string; win: number; loss: number; draw: number; gamesFor: number; gamesAgainst: number };

export default function TeamScoreboard({ event, scores, players }: Props) {
  const teams = [...new Set([...players.values()].map((p) => p.team).filter(Boolean))] as string[];
  if (teams.length !== 2) return null;
  const [nameA, nameB] = teams;

  const tally: Record<string, Tally> = {
    [nameA]: { name: nameA, win: 0, loss: 0, draw: 0, gamesFor: 0, gamesAgainst: 0 },
    [nameB]: { name: nameB, win: 0, loss: 0, draw: 0, gamesFor: 0, gamesAgainst: 0 },
  };
  let finished = 0;
  for (const m of event.matches) {
    const score: MatchScore | undefined = scores[m.no];
    if (!score) continue;
    // 경기의 A쪽이 어느 팀인지는 첫 선수의 소속으로 정한다 (편성은 항상 팀별로 갈린다)
    const sideTeam = players.get(m.teamA[0])?.team;
    if (!sideTeam || !tally[sideTeam]) continue;
    const otherTeam = sideTeam === nameA ? nameB : nameA;
    finished += 1;
    const o = outcomeForA(score);
    const a = tally[sideTeam];
    const b = tally[otherTeam];
    if (o === "win") { a.win += 1; b.loss += 1; }
    else if (o === "loss") { a.loss += 1; b.win += 1; }
    else { a.draw += 1; b.draw += 1; }
    a.gamesFor += score.scoreA; a.gamesAgainst += score.scoreB;
    b.gamesFor += score.scoreB; b.gamesAgainst += score.scoreA;
  }

  const A = tally[nameA];
  const B = tally[nameB];
  const lead = A.win === B.win ? (A.gamesFor - A.gamesAgainst > B.gamesFor - B.gamesAgainst ? nameA : A.gamesFor - A.gamesAgainst < B.gamesFor - B.gamesAgainst ? nameB : null) : A.win > B.win ? nameA : nameB;

  return (
    <StCard>
      <StCardHead>
        <StCardTitle>🥇 팀 승패</StCardTitle>
      </StCardHead>
      <StBoard>
        {[A, B].map((t) => (
          <StTeam key={t.name} $lead={lead === t.name}>
            <span className="name">{t.name}</span>
            <span className="wins">{t.win}<small>승</small></span>
            <span className="meta">
              {t.loss}패{t.draw > 0 ? ` · ${t.draw}무` : ""} · 게임 {t.gamesFor}:{t.gamesAgainst}
            </span>
          </StTeam>
        ))}
      </StBoard>
      <StCardHint>
        경기마다 이긴 팀에 1승. {finished}/{event.matches.length}경기 반영. 승수가 같으면 게임 득실이 앞선 쪽이 위예요.
        {lead ? ` 지금은 ${lead}이 앞서요.` : finished > 0 ? " 지금은 동률이에요." : ""}
      </StCardHint>
    </StCard>
  );
}

const StBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
`;

const StTeam = styled.div<{ $lead: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 1rem 0.75rem;
  border-radius: 0.9rem;
  background: ${({ $lead, theme }) => ($lead ? theme.semantic.primaryLight : theme.semantic.bg)};
  border: 1px solid ${({ $lead, theme }) => ($lead ? theme.semantic.primary : "transparent")};

  .name {
    font-size: 0.85rem;
    font-weight: 800;
    color: ${({ theme }) => theme.semantic.text};
  }

  .wins {
    font-size: 2rem;
    font-weight: 900;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
    color: ${({ $lead, theme }) => ($lead ? theme.semantic.primary : theme.semantic.text)};

    small {
      margin-left: 0.15rem;
      font-size: 0.9rem;
      font-weight: 800;
    }
  }

  .meta {
    font-size: 0.78rem;
    color: ${({ theme }) => theme.semantic.subText};
    font-variant-numeric: tabular-nums;
  }
`;
