"use client";

import { useState } from "react";
import { StCard, StCardHead, StCardHint, StCardTitle, StGhostBtn, StGuide, StTable, StTableWrap } from "../page.styles";
import type { TournamentEvent } from "./types";

type Props = { event: TournamentEvent };

// 참가자용 안내: 게임 방식 + 페어 교체 + 토너먼트 방식. 처음엔 접혀 있다. 한 줄은 짧게, 항목 사이는 넉넉히
export default function TournamentGuide({ event }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <StCard>
      <StCardHead>
        <StCardTitle>📖 대회 방식 안내</StCardTitle>
        <StGhostBtn type="button" onClick={() => setOpen((v) => !v)}>
          {open ? "접기" : "펼치기"}
        </StGhostBtn>
      </StCardHead>
      <StCardHint>처음 오신 분도 이 글만 읽으면 돼요. 게임은 어떻게 하고, 토너먼트는 어떻게 이어지는지.</StCardHint>
      {!open ? null : (
        <StGuide>
          <h4>🎾 게임 방식</h4>
          <ul>
            <li>
              <b>2:2 복식</b>이에요.
              <br />한 경기는 <b>{event.gamesToWin}게임을 먼저 따는 팀</b>이 이겨요. 예) 6:3, 6:5
            </li>
            <li>
              <b>5:5</b>가 되면 게임을 더 하지 않고 <b>7점 타이브레이크</b>로 승부를 가려요.
              <br />7점을 먼저 내되 2점 차가 나야 끝나요.
              <br />이긴 팀은 6:5로 적고, 타이브레이크 점수(예: 7-4)를 함께 적어요.
            </li>
            <li>
              팀은 4명, 팀 안에 <b>시드 1~4번</b>이 있어요. 1번이 가장 잘하는 사람이에요.
              <br />한 번에 코트에 서는 건 두 명(한 페어)이고, <b>4게임마다 페어를 바꿔요.</b>
            </li>
          </ul>

          <h4>🔁 페어 교체, 자세히</h4>
          <ul>
            <li>
              <b>페어는 세 가지, 순서는 항상 A → B → C</b>
              <StTableWrap>
                <StTable>
                  <thead>
                    <tr>
                      <th>페어</th>
                      <th>누구</th>
                      <th>몇 게임째</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><b>A</b></td>
                      <td>시드 2번 + 4번</td>
                      <td>1~4게임</td>
                    </tr>
                    <tr>
                      <td><b>B</b></td>
                      <td>시드 1번 + 3번</td>
                      <td>5~8게임</td>
                    </tr>
                    <tr>
                      <td><b>C</b></td>
                      <td>시드 1번 + 2번</td>
                      <td>9~12게임 (경기가 길어질 때만)</td>
                    </tr>
                  </tbody>
                </StTable>
              </StTableWrap>
              경기마다 순서를 바꾸지 않아요. 상대 팀도 같은 순서로 나와요.
            </li>
            <li>
              <b>예시</b>
              <StTableWrap>
                <StTable>
                  <thead>
                    <tr>
                      <th>결과</th>
                      <th>총 게임</th>
                      <th>페어A</th>
                      <th>페어B</th>
                      <th>페어C</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>6:4</td>
                      <td>10</td>
                      <td>1~4게임</td>
                      <td>5~8게임</td>
                      <td>9~10게임</td>
                    </tr>
                    <tr>
                      <td>6:1</td>
                      <td>7</td>
                      <td>1~4게임</td>
                      <td>5~7게임</td>
                      <td>안 나옴</td>
                    </tr>
                    <tr>
                      <td>6:5 (타이브레이크)</td>
                      <td>11</td>
                      <td>1~4게임</td>
                      <td>5~8게임</td>
                      <td>9·10게임 + 타이브레이크</td>
                    </tr>
                  </tbody>
                </StTable>
              </StTableWrap>
              경기가 끝나면 남은 페어 차례는 없어요.
              <br />5:5 타이브레이크는 9~12게임 담당인 <b>페어C(시드 1·2)</b>가 쳐요.
            </li>
            <li>
              <b>왜 4게임 단위냐면, 서브 때문이에요.</b>
              <br />복식은 게임마다 서브 팀이 바뀌고, 한 팀 안에서도 두 사람이 번갈아 서브해요.
              <br />4게임을 묶으면 코트에 선 네 사람이 서브 게임을 <b>정확히 한 번씩</b> 가져요.
              <br />홀수로 끊으면 누구는 두 번, 누구는 못 하니까 4게임씩 끊는 거예요.
            </li>
            <li>
              <b>시드 1·2번이 더 많이 뛰어요.</b>
              <br />1·2번은 페어 두 개(B·C, A·C)에 들어가요.
              <br />한 경기에 1·2번은 최대 8게임, 3·4번은 4게임이에요.
              <br />잘하는 사람이 후반 승부처에 더 나오게 일부러 그렇게 짠 거예요.
            </li>
            <li>
              <b>현장에서는 카드만 보면 돼요.</b>
              <br />경기 카드마다 우리 팀 페어A·B·C가 <b>선수 이름</b>으로 적혀 있어요.
              <br />게임 수가 4·8이 되면 카드 보고 다음 페어가 들어가요.
              <br />끝난 뒤엔 &ldquo;팀별 여정&rdquo; 탭에서 누가 몇 게임 뛰었는지 나와요.
            </li>
          </ul>

          <h4>⏱ 시간과 코트</h4>
          <ul>
            <li>
              경기당 예상 <b>{event.minutesPerMatch}분</b>이에요.
              <br />코트는 A~D 4면. 정해진 코트가 아니라 <b>비는 코트에 다음 경기</b>가 들어가요.
            </li>
          </ul>

          <h4>🏆 토너먼트 방식 — 더블 엘리미네이션</h4>
          <ul>
            <li>
              <b>두 번 져야 탈락</b>이에요.
              <br />한 번 지면 끝이 아니라 <b>패자조</b>로 내려가서 다시 기회를 받아요.
            </li>
            <li>
              <b>1라운드</b>: 8팀 전원이 4경기를 해요. (1·2번 시드, 3·4번, 5·6번, 7·8번)
              <br />이긴 4팀은 <b>승자조 4강</b>, 진 4팀은 <b>패자조 1라운드</b>로 가요.
            </li>
            <li>
              <b>승자조</b>는 4강 → 결승으로 올라가요.
              <br />승자조에서 진 팀은 그 시점의 패자조로 합류해요. 4강 패자는 패자조 2라운드로, 결승 패자는 패자조 결승으로.
            </li>
            <li>
              <b>패자조</b>는 1라운드 → 2라운드 → 준결승 → 결승 순서예요.
              <br />여기서 지면 두 번째 패배라 탈락(순위결정전)으로 가요.
            </li>
            <li>
              <b>그랜드 파이널</b>: 승자조 우승팀 vs 패자조 우승팀.
              <br />승자조 우승팀이 이기면 바로 우승이에요.
              <br />패자조 우승팀이 이기면 서로 1패씩이라 <b>리셋 재경기</b>를 한 번 더 해서 우승을 정해요.
            </li>
            <li>
              <b>순위결정전</b>으로 1~8위를 모두 정해요.
              <br />7-8위전: 패자조 1라운드에서 진 두 팀
              <br />5-6위전: 패자조 2라운드에서 진 두 팀
              <br />3-4위전: 패자조 준결승 패자 vs 패자조 결승 패자
            </li>
            <li>
              팀마다 <b>최소 3경기, 최대 6경기</b>(리셋까지 가면 7경기) 뛰어요.
            </li>
          </ul>

          <h4>🕒 하루 흐름</h4>
          <ul>
            <li>{event.beforeNote || "개회식 · 몸풀기"}</li>
            <li>1타임 1라운드(4코트) → 2타임 승자조 4강 + 패자조 1R(4코트) → 3타임 승자조 결승 + 패자조 2R + 7-8위전(4코트)</li>
            <li>4타임 패자조 준결승 + 5-6위전(2코트) → 5타임 패자조 결승(1코트) → 6타임 그랜드 파이널 + 3-4위전(2코트) → 필요하면 7타임 리셋 재경기</li>
            <li>{event.afterNote || "시상식 · 폐회식"}</li>
            <li>3타임까지는 4코트가 다 돌고, 그 뒤엔 남는 팀이 줄어 일부 코트가 쉬어요. 더블 엘리미네이션 구조상 어쩔 수 없는 부분이에요.</li>
          </ul>

          <h4>📱 점수 넣는 법</h4>
          <ul>
            <li>
              경기 시작 때 카드의 <b>&ldquo;코트 X&rdquo;</b> 버튼을 눌러 빈 코트를 고르고,
              <br />끝나면 게임 수를 넣고 <b>&ldquo;경기 끝 · 점수 저장&rdquo;</b>을 눌러요.
              <br />이긴 팀이 넣는 걸로 정하면 헷갈리지 않아요.
            </li>
            <li>
              저장하면 다음 경기에 팀이 자동으로 채워지고, 다른 사람 화면에도 곧 보여요.
              <br />잘못 넣었으면 &ldquo;고치기&rdquo;로 바로잡아요.
            </li>
          </ul>
        </StGuide>
      )}
    </StCard>
  );
}
