# 약속 잡기(meeting) 서비스 구조 설계

> 2026-07-15 기준. 약속 잡기(meeting) 서비스의 도메인 모델, 화면 구조, 저장 아키텍처를 정리한다.
> 메뉴 관점 분석은 [menu-details/meeting.md](../menu-details/meeting.md), 라우팅 설계 배경은 [ADR-002](../adr/ADR-002-slug-shortcode-routing.md), 전체 개선 항목은 [improvement-backlog.md](../improvement-backlog.md) 참고.
>
> meeting·calc·game은 모두 "방(room) 만들기 → 참가자 모으기 → 결과 확정" 라이프사이클을 공유하는 room 기반 서비스다. 세부 비교는 [calc-structure.md](calc-structure.md), [game-structure.md](game-structure.md) 참고.

## 1. 서비스 개요

여러 사람이 가능한 날짜를 모으는 협업형 일정 조율 도구. 핵심 UX는 "가능한 날짜를 고르기"가 아니라 **"안 되는 날짜를 소거하기"**다.

- **방 생성**: 방 이름 + 시작일 (+ 선택적 종료일/사전 멤버) → 사람이 읽을 수 있는 `slug-shortCode` 주소 발급
- **VOTING 단계**: 참가자가 이름 + 불가능한 날짜를 등록 (참석 불가 표시도 별도 지원)
- **CONFIRM 단계**: 최소 2명 참여 시 투표 마감 → 남은 후보 날짜 중 선호 투표 → 날짜 확정
- **확정 후 연계**: 참석자 기준으로 N빵 계산기(calc) 방, 장소투표(place/dinner) 방을 자동 생성·연결

## 2. 화면·컴포넌트 구조

```text
app/meeting/page.tsx                    생성 페이지 (PageIntro + RoomForm + FooterGuide)
├── create-room/RoomForm.tsx            입력 폼: 방 이름 / 시작일 / 종료일(직접 지정 토글) / 주말 포함 / 사전 멤버
├── create-room/FooterTips.tsx
└── room/
    ├── page.tsx                        redirect("/meeting") — 레거시 인덱스 가드
    └── [id]/                           상세 라우트 (slug-shortCode 또는 구형 UUID)
        ├── page.tsx                    상태 허브 — useRoom + useRoomActions 조립, step별 섹션 분기 렌더
        ├── page.styles.ts
        ├── useRoomActions.ts           확정 후 액션: 정산방(calc)·장소투표방(dinner) 생성/연결
        └── components/                 페이지 상태별 "조립" 컴포넌트 3개
            ├── VotingSection.tsx           VOTING 단계 조립
            ├── ConfirmVotingSection.tsx    CONFIRM 단계 조립
            └── FinalConfirmedSection.tsx   확정 후 조립
└── room/detail/                        재사용 leaf UI 8개 — [id]/components/*.tsx가 상대경로로 import
    ├── RoomHeader.tsx                  헤더: 제목 + 기간 표시 + 마감 버튼
    ├── PeriodEditor.tsx                기간 인라인 수정
    ├── CalendarGrid.tsx                날짜 그리드 (456줄, 이 서비스 최대 파일)
    ├── DateControlButtons.tsx          전체선택/초기화
    ├── NameInput.tsx                   이름 입력 + 수정모드 안내
    ├── VoteSubmitButtons.tsx           투표 제출/불참 제출
    ├── ParticipantList.tsx             참가자 목록, hover 시 캘린더 하이라이트 연동
    └── ConfirmedResultCard.tsx         확정 결과 카드 (정산/장소투표 진입 버튼 포함)
```

`room/[id]/components/`(3개, 상태별 조립)와 `room/detail/`(8개, 실제 표시 요소)로 폴더가 이중화되어 있다 — 둘 다 이름이 "components" 계열이라 처음 보면 역할 구분이 어렵다. 개선 백로그 P3-13에 병합 대상으로 기재됨.

핵심 훅:

| 훅 | 역할 |
|---|---|
| `useRoom` (`hooks/useRoom.ts`, 410줄) | 방/참가자/확정투표 로딩 및 상태머신(`VOTING`\|`CONFIRM`), 3초 polling, 캘린더 그리드 계산, 참가자 CRUD·확정·구제(rescue) 등 액션 전체 |
| `useCreateRoom` (`hooks/useCreateRoom.ts`, 145줄) | 방 생성, `slug`+`short_code` 발급(충돌 시 최대 5회 재시도), 종료일 자동 계산 |
| `useRoomActions` (`app/meeting/room/[id]/useRoomActions.ts`, 157줄) | 확정 후 정산방(`calc_rooms`)·장소투표방(`dinner_rooms`) 생성 또는 기존 연결로 이동 |

## 3. 데이터 모델

DB 테이블(코드 기준 추정, 별도 클라이언트 타입 없음 — `useRoom.ts`는 `room`을 `useState<any>`로 다룬다):

```text
rooms
  id, name, start_date, end_date, include_weekend,
  slug, short_code, confirmed_date, is_voting_closed,
  calc_room_id, dinner_room_id     -- 타 서비스 방 연결용 FK 성격 컬럼

participants
  id, room_id, name, unavailable_dates(string[]), is_absent

confirm_votes
  room_id, name, voted_date        -- CONFIRM 단계 참가자별 선호 날짜(복수 가능)
```

클라이언트 타입(`types/index.ts`)은 참가자 뷰 모델만 정의한다:

```ts
interface UserVote {
  id: string | number;
  name: string;
  unavailableDates: Date[];
  isAbsent: boolean;
}

interface ModalState {
  isOpen: boolean;
  type: "alert" | "confirm";
  message: string;
  onConfirm?: () => void;
}
```

`room` 자체에 대응하는 인터페이스가 없어 필드 오탈자를 컴파일 타임에 잡지 못한다 — account-book의 `AccountEntry`처럼 강타입 모델을 도입한 서비스와 대비된다.

## 4. 저장 아키텍처

```text
[클라이언트]                              [서버 (Supabase)]
useRoom.fetchData (3초 polling)
  ├→ supabase.from("rooms").select        (id 또는 short_code 매칭)
  ├→ supabase.from("participants").select .eq("room_id", ...)
  └→ supabase.from("confirm_votes").select .eq("room_id", ...)

쓰기: RPC/SECURITY DEFINER 없음 — 테이블 CRUD를 훅에서 직접 호출
  upsertParticipant  = delete(room_id+name) 후 insert (update 아님)
  handleToggleDate    = rooms.update({ confirmed_date })
  submitConfirmVote   = confirm_votes.delete(room_id+name) 후 insert
```

- **주소 해석**: `isUuid(roomId)`이면 `rooms.id`로 조회, 아니면 `parseShortCode`로 `slug-short_code`를 분리해 `short_code`로 조회. `toSlug`/`createShortCode`/`isUuid`/`parseShortCode`는 `lib/slug.ts` 공용 유틸 — calc·place와 공유한다.
- 구형 UUID 링크로 진입해도 `room.short_code`가 있으면 `router.replace`로 `slug-short_code` 주소로 정규화한다(`room/[id]/page.tsx:69-76`).
- **동기화**: realtime 구독이 아니라 3초 `setInterval` polling. 데이터 갱신은 각 액션이 성공 후 `fetchData()`를 즉시 재호출하는 방식으로 체감 지연을 보완한다.
- **타 서비스 연계**: 확정 시 `rooms.calc_room_id`/`dinner_room_id`에 연결된 방 id를 기록. calc 쪽은 `calc_replace_room_data` RPC로 멤버 스냅샷을 교체하고, dinner 쪽은 신규 row를 생성해 연결한다(`useRoomActions.ts`).
- 테이블 직접 접근이며 RLS/세션 검증은 없음 — anon key 기반 설계의 트레이드오프는 [ADR-001](../adr/ADR-001-hybrid-persistence-strategy.md)에서 수용된 결정으로 다룬다.

## 5. 도메인 로직 메모

- **종료일 자동 계산**(`useCreateRoom.ts:51-63`): 커스텀 기간을 고르지 않으면 시작일 기준 "다음 일요일까지 남은 일수 + 14일"을 더해 종료일을 산출한다. 즉 최소 2주 + 주중 보정 범위가 자동으로 잡힌다.
- **캘린더 그리드**(`useRoom.ts:121-143`): `start_date`~`end_date`(없으면 +20일)를 `eachDayOfInterval`로 뽑고, `includeWeekend` 플래그로 주말을 필터링한 뒤 첫 날의 요일만큼 `null` 슬롯을 앞에 채워 7열 그리드를 맞춘다.
- **2단계 상태머신**: `VOTING`(불가능한 날짜 수집) → `CONFIRM`(후보 날짜 재투표). 호스트 개념이 없어 참가자 누구나 `handleGoToConfirm`을 호출할 수 있고, 최소 참가자 2명 검증만 존재한다.
- **확정 취소/구제**: `handleReset`은 `confirmed_date`를 `null`로 되돌려 VOTING으로 복귀시킨다. `handleRescueUser`는 특정 참가자를 위해 확정을 취소하면서 동시에 그 사람의 수정 모드까지 열어준다 — 별도 변경 이력 없이 덮어쓰기.
- **short code 발급**: 6자리 코드, `insert` 시 unique violation(`23505`)이면 최대 5회 재시도 — calc의 `createRoom`과 동일한 재시도 코드가 파일 단위로 중복돼 있다.

## 6. 알려진 제약 / 후속 과제

- `room/[id]/components/`(상태별 조립 3개)와 `room/detail/`(leaf 8개)로 나뉜 이중 "components" 폴더 컨벤션 — 개선 백로그 P3-13, 한 방식으로 병합 검토 대상.
- 3초 polling 기반 동기화 — 실시간성·트래픽 면에서 game 서비스의 Supabase realtime 채널 방식보다 비효율적이다. realtime 전환은 아직 ADR화되지 않았다.
- `room` 상태가 타입 없이 `any`로 다뤄진다 — account-book의 `AccountEntry`처럼 강타입 인터페이스 도입 여지가 있다.
- **room 훅 중복**: `useRoom`(410줄)은 meeting·calc·game·place 4개 서비스에 흩어진 "방 생성→참가자→투표/제출" 훅 5벌 중 가장 큰 파일이다 — `useGameRoom`(270줄) · `usePlaceVote`(240줄) · `useRoomActions`(157줄) · `useCreateRoom`(145줄)과 테이블명만 바꿔 동일 라이프사이클을 반복한다. 개선 백로그 P2-5(제네릭 `useRealtimeRoom(config)` 통합 후보)에 포함되어 있으나, 자동 회귀 테스트 부재로 현재 보류 상태다.
- 이름 기반 수정/삭제 흐름이라 동명이인 충돌에 취약하고, 링크만 있으면 누구나 참가/삭제가 가능해 권한 통제가 약하다.
