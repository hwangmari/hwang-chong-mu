"use client";

import styled from "styled-components";

// 경기 목록 카드 맨 위에 붙어 스크롤해도 헤더(3.5rem) 아래에 고정되는 '다음 시작' 띠.
// 교류전(MatchQueue)과 토너먼트(TournamentView)가 같이 쓴다 (2026-09-15).
export type NextUpCourt = { court: string; free: boolean; label: string };

type Props = {
  ready: boolean; // 지금 시작 가능한 경기인지
  position: number; // 경기 번호(표시용)
  names: string; // "이필환·서지수 vs 정현일·남희수"
  why: string; // "지금 시작 가능" / 대기 이유
  courts: NextUpCourt[];
  onJump: () => void;
};

export default function NextUpBar({ ready, position, names, why, courts, onJump }: Props) {
  return (
    <StNextSticky $ready={ready} type="button" onClick={onJump} aria-label={`${position}번 경기 카드로 이동`}>
      <span className="tag">{ready ? "▶ 다음 시작" : "다음"}</span>
      <b>{position}번</b>
      <span className="names">{names}</span>
      <span className="why">{why}</span>
      {/* 코트 현황 한 줄: 비어 있음 / 몇 번 경기 몇 분 경과 */}
      <span className="courts">
        {courts.map((c) => (
          <span key={c.court} className={c.free ? "court free" : "court busy"}>
            코트 {c.court} · {c.label}
          </span>
        ))}
      </span>
    </StNextSticky>
  );
}

const StNextSticky = styled.button<{ $ready: boolean }>`
  position: sticky;
  top: 3.9rem;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
  width: 100%;
  margin: 0.25rem 0 0.75rem;
  padding: 0.55rem 0.8rem;
  border-radius: 0.8rem;
  border: 1px solid ${({ $ready, theme }) => ($ready ? theme.colors.blue600 : theme.colors.gray200)};
  background: ${({ $ready, theme }) => ($ready ? theme.colors.blue600 : theme.colors.white)};
  color: ${({ $ready, theme }) => ($ready ? theme.colors.white : theme.colors.gray900)};
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
  text-align: left;
  cursor: pointer;
  font-size: 0.85rem;

  .tag {
    flex: none;
    font-size: 0.7rem;
    font-weight: 900;
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
    background: ${({ $ready, theme }) => ($ready ? "rgba(255,255,255,0.22)" : theme.colors.gray100)};
  }

  b {
    flex: none;
    font-weight: 900;
  }

  .names {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 700;
  }

  .why {
    flex: none;
    margin-left: auto;
    font-size: 0.75rem;
    font-weight: 700;
    opacity: 0.85;
  }

  .courts {
    flex-basis: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 0.1rem;
  }

  .court {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
    background: ${({ $ready, theme }) => ($ready ? "rgba(255,255,255,0.16)" : theme.colors.gray100)};
  }

  .court.free {
    background: ${({ $ready, theme }) => ($ready ? "rgba(255,255,255,0.28)" : theme.colors.teal50)};
    color: ${({ $ready, theme }) => ($ready ? theme.colors.white : theme.colors.teal600)};
  }

  @media (max-width: 767px) {
    .why {
      flex-basis: 100%;
      margin-left: 0;
    }
  }
`;
