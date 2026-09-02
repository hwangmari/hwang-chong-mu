"use client";

import { useState } from "react";
import { endTime } from "../format";
import { FIXED_RULES, RULE_INFO, isRuleOn } from "../rules";
import { StCard, StCardHead, StCardHint, StCardTitle, StGhostBtn, StGuide } from "../page.styles";
import { MATCH_TYPE_LABEL, POINTS, type MatchType, type TennisEvent } from "../types";

type Props = { event: TennisEvent };

// 참가자용 안내: 게임 방식·진행 방식·점수 넣는 법. 숫자는 이 교류전 데이터에서 계산한다
export default function ExchangeGuide({ event }: Props) {
  const [open, setOpen] = useState(false);

  const men = event.players.filter((p) => p.gender === "M");
  const women = event.players.filter((p) => p.gender === "F");
  const apps = new Map<string, number>();
  for (const m of event.matches) for (const n of [...m.teamA, ...m.teamB]) apps.set(n, (apps.get(n) ?? 0) + 1);
  const range = (names: string[]) => {
    const counts = names.map((n) => apps.get(n) ?? 0);
    if (counts.length === 0) return "-";
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    return min === max ? `${min}회` : `${min}~${max}회`;
  };
  const typeCounts = (["men", "women", "mixed"] as MatchType[])
    .map((t) => ({ t, n: event.matches.filter((m) => m.type === t).length }))
    .filter((x) => x.n > 0);
  const onRules = RULE_INFO.filter((r) => isRuleOn(event.rules, r.id));
  const teams = [...new Set(event.players.map((p) => p.team?.trim()).filter(Boolean))];

  return (
    <StCard>
      <StCardHead>
        <StCardTitle>📖 교류전 방식 안내</StCardTitle>
        <StGhostBtn type="button" onClick={() => setOpen((v) => !v)}>
          {open ? "접기" : "펼치기"}
        </StGhostBtn>
      </StCardHead>
      <StCardHint>처음 오신 분도 이 글만 읽으면 돼요. 어떤 경기를 몇 번 뛰고, 승점은 어떻게 매기는지.</StCardHint>
      {!open ? null : (
        <StGuide>
          <h4>🎾 게임 방식</h4>
          <ul>
            <li>
              <b>2:2 복식</b>이에요. 종목은{" "}
              {typeCounts.map((x, i) => (
                <span key={x.t}>
                  {i > 0 ? " · " : ""}
                  <b>{MATCH_TYPE_LABEL[x.t]}</b> {x.n}경기
                </span>
              ))}
              , 총 {event.matches.length}경기예요.
            </li>
            <li>
              남자 복식은 남자 4명, 여자 복식은 여자 4명, 혼합 복식은 팀마다 남 1·여 1이에요. 경기마다 짝이 바뀌니 카드에서 내 짝과 상대를 확인하세요.
            </li>
            <li>
              한 경기는 <b>{event.minutesPerMatch}분</b>이에요. 끝나면 A팀 : B팀 <b>게임 수</b>를 그대로 적어요 (예: 6 : 4). 게임 수가 같으면 무승부예요.
            </li>
            <li>
              <b>승점</b>은 승 {POINTS.win}점 · 무 {POINTS.draw}점 · 패 {POINTS.loss}점이고, 같으면 득실(딴 게임 − 내준 게임) → 딴 게임 순으로 순위를 가려요.
              개인 순위표라서 짝이 바뀌어도 내 점수는 나에게 쌓여요.
            </li>
            {teams.length > 0 ? (
              <li>
                소속은 {teams.join(" · ")}이고, 이 교류전은 소속을 섞어서 짝을 짜는 교류 방식이에요. 순위표에서 소속별로도 볼 수 있어요.
              </li>
            ) : null}
          </ul>

          <h4>👥 출전 횟수</h4>
          <ul>
            <li>
              남자 {men.length}명은 각 <b>{range(men.map((p) => p.name))}</b>, 여자 {women.length}명은 각 <b>{range(women.map((p) => p.name))}</b> 뛰어요.
              &ldquo;선수별 일정&rdquo;에서 내 이름을 누르면 몇 번째 경기인지 다 나와요.
            </li>
            <li>
              대진표가 지킨 규칙:{" "}
              {FIXED_RULES.map((r) => r.label).join(", ")}
              {onRules.length > 0 ? `, ${onRules.map((r) => (r.id === "maxRest" ? `연속 휴식 ${event.rules.maxRest}묶음 이하` : r.label)).join(", ")}` : ""}.
            </li>
          </ul>

          <h4>🏟️ 진행 방식 — 순서 목록 + 빈 코트</h4>
          <ul>
            <li>
              코트는 <b>{event.courts}면</b>이고, 경기는 <b>목록 순서대로 비는 코트</b>에 들어가요. 정해진 코트나 시간이 있는 게 아니라, 앞 경기가 끝나면 다음 경기가 바로 들어가요.
            </li>
            <li>
              카드가 파란 <b>&ldquo;지금 시작 가능&rdquo;</b>이 되면 코트를 골라 시작 버튼을 눌러요. 선수 4명이 다른 경기 중이 아니고 빈 코트가 있어야 해요.
            </li>
            <li>
              화면의 시간은 <b>예상</b>이에요. {event.startTime}에 시작해 순조로우면 {endTime(event)}쯤 끝나고, 실제 진행에 맞춰 계속 다시 계산돼요.
            </li>
            <li>급하게 순서를 바꿔야 하면 진행자가 &ldquo;대진표 수정&rdquo;에서 끌어다 놓거나 ▲▼로 옮겨요.</li>
          </ul>

          <h4>📱 점수 넣는 법</h4>
          <ul>
            <li>경기 시작 때 <b>&ldquo;코트 X에서 시작&rdquo;</b>을 누르고, 끝나면 게임 수를 넣고 <b>&ldquo;경기 끝 · 점수 저장&rdquo;</b>을 눌러요. 이긴 팀이 넣는 걸로 정하면 헷갈리지 않아요.</li>
            <li>저장하면 순위표에 바로 반영되고 다른 사람 화면에도 곧 보여요. 잘못 넣었으면 &ldquo;고치기&rdquo;로 바로잡아요. 시작 버튼을 눌러야 플레이 시간이 남아요.</li>
          </ul>
          {event.afterNote ? (
            <>
              <h4>🍽️ 경기 후</h4>
              <ul>
                <li>{event.afterNote}</li>
              </ul>
            </>
          ) : null}
        </StGuide>
      )}
    </StCard>
  );
}
