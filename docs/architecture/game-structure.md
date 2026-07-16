# 게임방(game) 서비스 구조 설계

> 2026-07-15 기준. 게임방(game) 서비스의 도메인 모델, 화면 구조, 저장 아키텍처를 정리한다.
> 메뉴 관점 분석은 [menu-details/game.md](../menu-details/game.md), 전체 개선 항목은 [improvement-backlog.md](../improvement-backlog.md) 참고.
>
> meeting·calc·game은 모두 "방(room) 만들기 → 참가자 모으기 → 결과 확정" 라이프사이클을 공유하는 room 기반 서비스다. 세부 비교는 [meeting-structure.md](meeting-structure.md), [calc-structure.md](calc-structure.md) 참고.

## 1. 서비스 개요

친구들과 가볍게 즐기는 복불복/즉석 미니게임 허브. **로컬 즉시 실행형("빠른 시작")과 실시간 방 참여형("방 만들기")이 한 서비스 안에 공존**하는 것이 meeting·calc와 가장 다른 지점이다.

- **빠른 시작**: 게임 선택 → 참가자 이름만 로컬에 추가 → 최소 2명이면 즉시 시작. Supabase를 전혀 쓰지 않는다.
- **방 만들기**: 닉네임/비밀번호/한마디를 입력해 방 생성 → 친구들이 각자 접속해 참가 → 호스트가 게임 선택·시작 → 실시간으로 상태 동기화.
- 지원 게임: 텔레파시, 광클 대전(클리커), 돌림판(휠), 사다리 타기 — "방 만들기"는 4종 전부, "빠른 시작"은 사다리/돌림판만 제공한다(`GAME_OPTIONS`, `app/game/page.tsx`).

## 2. 화면·컴포넌트 구조

```text
app/game/page.tsx                     로비 — viewMode(SELECT/QUICK_LIST/CREATE) 3-상태 단일 페이지
                                       (createRoom에서 supabase 직접 호출)
├── quick/[id]/page.tsx               빠른 시작 — 로컬 상태만(참가자 이름 배열), Supabase 미사용
└── [id]/                             방 상세 라우트 (roomId = 정수 PK, slug 없음)
    ├── page.tsx                      로비/게임 분기 — useGameRoom 조립, status==="playing"이면 게임 컴포넌트로 전환
    ├── RoomHeader.tsx                제목 + 링크 복사
    ├── GameSelector.tsx              호스트 전용 게임 선택 UI
    ├── JoinForm.tsx                  참가/재입장(닉네임+비밀번호) + 호스트의 게임 시작 버튼
    └── ParticipantList.tsx           참가자 목록 + 게스트 추가 + 강퇴(호스트 전용)
└── components/                       실제 게임 로직 4종
    ├── TelepathyGame.tsx (279줄)     supabase 직접 호출 — 정답/점수 갱신
    ├── ClickerGame.tsx (204줄)       supabase 직접 호출 — 점수 갱신 (개선 백로그 예시 파일)
    ├── WheelGame.tsx (293줄)         supabase 직접 호출 — 결과 기록
    └── LadderGame.tsx (633줄)        supabase 미사용, roomData/participants prop만으로 렌더 — 이 서비스 최대 파일
```

핵심 훅:

| 훅 | 역할 |
|---|---|
| `useGameRoom` (`hooks/useGameRoom.ts`, 270줄) | 방/참가자 로딩, `localStorage` 기반 내 id·닉네임 복원, 호스트 판별, Supabase realtime 채널 구독(`game_participants`/`game_rooms`), 참가·게스트추가·강퇴, 게임 선택/시작/종료, 3초 카운트다운 |

## 3. 데이터 모델

```text
game_rooms
  id, room_code(6자리 표시용 — 라우팅에는 미사용),
  title, game_type, status("waiting" | "playing"),
  current_question, is_result_open

game_participants
  id, room_id, nickname, password, message,
  is_host, score, selected_answer, joined_at
```

`roomData`/`participants`는 모두 `useState<any>`로 다뤄지고(`useGameRoom.ts:12,14`, `eslint-disable` 처리) 별도의 `GameRoom`/`Participant` 인터페이스가 없다 — meeting과 마찬가지로 room 계열 서비스는 강타입 모델을 도입하지 않았다.

## 4. 저장 아키텍처

```text
[클라이언트]                                  [서버 (Supabase)]
useGameRoom.fetchRoomData (최초 1회)
  ├→ game_rooms.select      .eq("id", roomId)
  └→ game_participants.select .eq("room_id", roomId).order("joined_at")

useGameRoom.subscribeRealtime
  └→ supabase.channel(`room_${roomId}`)
       .on(postgres_changes, game_participants, "*")   → fetchRoomData() 재호출
       .on(postgres_changes, game_rooms, "UPDATE")      → payload.new로 즉시 state 반영
```

- 3개 room 서비스 중 **유일하게 Supabase realtime을 사용**한다. meeting은 3초 polling, calc는 동기화 메커니즘 자체가 없다.
- **인증 없음**: 닉네임 + 4자리 비밀번호를 평문으로 저장·비교(`handleJoin`)해 재입장을 판별하고, `localStorage`에 `my_id`/`my_nickname`을 저장해 로컬 세션을 유지한다.
- **데이터 레이어 부재**: `useGameRoom.ts`는 훅 안에서 supabase를 직접 호출한다(서비스 계층 없음 — meeting/calc와 동일 패턴). 그런데 게임 로직 컴포넌트인 `ClickerGame.tsx`(L48)·`TelepathyGame.tsx`·`WheelGame.tsx`까지 각자 `@/lib/supabase`를 직접 import해 점수/정답을 갱신하는 **두 번째 경로**가 존재한다. `LadderGame.tsx`만 예외적으로 supabase를 참조하지 않고 prop만으로 렌더된다.
- **빠른 시작**(`quick/[id]/page.tsx`)은 Supabase를 전혀 참조하지 않는 완전 로컬 모드다 — 새로고침하면 상태가 사라지고 별도 저장소도 없다.
- **주소 체계**: meeting·calc의 `slug-shortCode`([ADR-002](../adr/ADR-002-slug-shortcode-routing.md))와 달리 `room.id`(정수 PK)를 그대로 라우트에 노출한다(`/game/${room.id}`). `room_code`(6자리) 필드는 생성 시 채워지지만 어디서도 조회에 쓰이지 않는 죽은 필드로 보인다.

## 5. 도메인 로직 메모

- **호스트 판별**: `game_participants.is_host` 플래그. 방 생성자가 첫 참가자로 insert되며 `is_host: true`로 고정되고, 이후 위임/변경 로직은 없다.
- **게임 시작**(`handleStartGame`): 모든 참가자의 `score`/`selected_answer`를 0/null로 리셋한 뒤 `game_rooms.status`를 `"playing"`으로 변경한다. realtime `UPDATE`를 수신한 다른 참가자는 상태 전이를 감지해 3초 카운트다운(로컬 `setTimeout`, 서버 동기화 아님) 후 게임 화면으로 전환한다.
- 게임 선택은 호스트만 가능(`handleSelectGame`이 `isHost` 체크), 나머지 참가자에게는 realtime으로 전파된다.
- URL 쿼리(`?game=on`)로 게임 화면 진입 여부를 표시하고, 뒤로가기(`popstate`에 준하는 `searchParams` 변화 감지)로 게임을 자동 종료 처리한다(`useGameRoom.ts:37-43`).

## 6. 알려진 제약 / 후속 과제

- **데이터 레이어 부재가 3개 room 서비스 중 가장 뚜렷하다**: `ClickerGame.tsx`/`TelepathyGame.tsx`/`WheelGame.tsx`가 각자 supabase를 직접 호출해 `useGameRoom`을 우회한다. 개선 백로그 P2-4에서 `no-restricted-imports` ESLint 경고 가드는 반영됐지만, 기존 위반 파일 정리는 아직 후속 과제로 남아 있다.
- 인증 강도가 낮다 — 비밀번호 평문 저장/비교, 세션·토큰 없음. 재접속 시 동명 닉네임 충돌에 취약하다.
- **room 훅 중복**: `useGameRoom`(270줄)도 개선 백로그 P2-5의 room 훅 5벌 중복 사례다 — `useRoom`(410줄) · `usePlaceVote`(240줄) · `useRoomActions`(157줄) · `useCreateRoom`(145줄)과 "방 생성→참가자→투표/제출" 라이프사이클을 테이블명만 바꿔 반복한다. 이 서비스는 유일하게 realtime을 쓰기 때문에, 통합 시 나머지 4개(polling/무동기화 기반)와 인터페이스를 맞추는 설계 비용이 가장 클 것으로 예상된다.
- 게임별 상태 모델이 제각각 커질 수 있다 — 공통 Game Engine 인터페이스가 없고, `LadderGame.tsx`(633줄)가 이 서비스에서 유독 거대한 것도 이와 무관치 않다.
- `room_code` 필드가 생성만 되고 실제 조회 경로에서 쓰이지 않는 죽은 데이터로 보인다 — 제거 또는 용도 확인 필요.
