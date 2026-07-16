# N빵 계산기(calc) 서비스 구조 설계

> 2026-07-15 기준. N빵 계산기(calc) 서비스의 도메인 모델, 화면 구조, 저장 아키텍처를 정리한다.
> 메뉴 관점 분석은 [menu-details/calc.md](../menu-details/calc.md), 라우팅 설계 배경은 [ADR-002](../adr/ADR-002-slug-shortcode-routing.md), 전체 개선 항목은 [improvement-backlog.md](../improvement-backlog.md) 참고.
>
> meeting·calc·game은 모두 "방(room) 만들기 → 참가자 모으기 → 결과 확정" 라이프사이클을 공유하는 room 기반 서비스다. 세부 비교는 [meeting-structure.md](meeting-structure.md), [game-structure.md](game-structure.md) 참고.

## 1. 서비스 개요

공통 비용을 입력하면 **최소 이체 횟수**로 "누가 누구에게 얼마"를 계산해주는 더치페이 정산 도구.

- **방 생성**: 모임 이름만 입력하면 즉시 생성, meeting과 동일한 `slug-shortCode` 주소 발급([ADR-002](../adr/ADR-002-slug-shortcode-routing.md))
- **입력**: 멤버 추가 → 지출 입력(공통/개인 구분) → 정산 결과 자동 산출
- **약속 잡기(meeting) 연계**: 약속이 확정되면 `rooms.calc_room_id`로 연결된 정산 방이 자동 생성되거나, 이미 있으면 참석자 명단만 갱신되어 재사용된다(`app/meeting/room/[id]/useRoomActions.ts`).
- 정산 결과는 "총 지출 → 리스트 → 이체 안내 → 카톡 공유용 텍스트" 순서로 화면에 노출된다.

## 2. 화면·컴포넌트 구조

```text
app/calc/page.tsx                     생성 페이지 (PageIntro + Input + CreateButton)
└── [id]/page.tsx                     상세 페이지 — fetchRoomData/useCalculator 조립, CalcMainContent에 위임
    └── components/
        ├── CalcMainContent.tsx       6개 섹션 조립 (Manager → Input → List → Report → List → Share)
        ├── MemberManager.tsx         멤버 추가/삭제
        ├── ExpenseInput.tsx          지출 입력 폼 (payer / description / amount / type)
        ├── ExpenseList.tsx           지출 목록 + 인라인 금액 수정/삭제 (354줄, 이 서비스 최대 파일)
        ├── SettlementReport.tsx      총액 / 1인당 부담액 / 멤버별 표
        ├── SettlementList.tsx        최종 이체 목록 (from → to → amount)
        ├── SettlementSummary.tsx     ⚠️ 어디서도 import되지 않는 고아 컴포넌트
        └── ui/
            ├── ShareButton.tsx       Web Share API → 실패 시 클립보드 폴백, 카톡 공유용 텍스트 조립
            ├── Card.tsx
            └── SectionTitle.tsx
```

`CalcMainContent.tsx`는 `SettlementSummary`를 import하지 않는다 — `SettlementSummary.tsx`(77줄)는 실제로 어느 화면에서도 렌더되지 않는 죽은 파일로 보인다.

핵심 훅:

| 훅 | 역할 |
|---|---|
| `useCalcPersistence` (`hooks/useCalcPersistence.ts`, 138줄) | 생성(`slug`+`short_code` 발급, 충돌 시 최대 5회 재시도) · 로드(`calc_rooms`/`calc_members`/`calc_expenses` 조회) · 저장(`calc_replace_room_data` RPC로 멤버+지출 전체 스냅샷 교체) |
| `useCalculator` (`hooks/useCalculator.ts`, 107줄) | 순수 계산 엔진(`useMemo`) — 공통지출 필터 → 1인당 분담 → 잔액 → 최소 이체 그리디 매칭 |

## 3. 데이터 모델

```text
calc_rooms
  id, room_name, slug, short_code

calc_members
  room_id, name

calc_expenses
  id, room_id, payer, description, amount, type("COMMON" | "PERSONAL")
```

클라이언트 타입은 `types/index.ts`에 정의되어 있지만, 동일한 `Expense` 인터페이스가 `useCalcPersistence.ts`·`[id]/page.tsx`·`CalcMainContent.tsx` 3곳에 로컬로 재선언되어 있다(사실상 중복):

```ts
type ExpenseType = "COMMON" | "PERSONAL";

interface Expense {
  id: number;
  payer: string;
  description: string;
  amount: number;
  type: ExpenseType;
}
```

정산 결과 shape은 별도 타입 없이 `useCalculator`가 반환하는 인라인 객체로만 존재한다:

```ts
{
  totalCommonSpend: number;
  perPersonShare: number;
  settlements: { from: string; to: string; amount: number }[];
  remainder: number;
  remainderReceiver: string | null;
}
```

## 4. 저장 아키텍처

```text
[클라이언트]                                  [서버 (Supabase)]
useCalcPersistence.fetchRoomData (최초 1회)
  ├→ calc_rooms.select   (id 또는 short_code 매칭)
  ├→ calc_members.select .eq("room_id", ...)
  └→ calc_expenses.select .eq("room_id", ...) .order("id")

변경 발생 시 (멤버/지출 추가·삭제·수정)
  로컬 state 즉시 갱신 (updateAndSave)
    └→ calc_replace_room_data RPC 1회 — members[] + expenses[] 전체 교체
```

- meeting이 `rooms`/`participants`를 row 단위로 insert/delete하는 것과 달리, calc는 **"방 전체 상태 스냅샷 교체"** 패턴이다 — 멤버 하나만 추가해도 멤버 배열과 지출 배열 전체를 RPC로 다시 보낸다.
- **동기화 메커니즘 없음**: 최초 마운트 시 1회 로드 후에는 polling도 realtime도 없다. meeting(3초 polling)·game(realtime 채널)과 달리, 본인이 변경할 때만 저장되고 다른 참가자의 변경은 새로고침 전까지 보이지 않는다.
- 주소 해석은 meeting과 동일하게 `lib/slug.ts`의 `isUuid`/`parseShortCode`를 공유하며, UUID로 진입해도 `router.replace`로 `slug-short_code` 주소로 정규화된다.
- `app/calc/components/` 내부에서는 supabase를 직접 호출하는 곳이 없다 — 모든 Supabase 접근이 `useCalcPersistence` 훅에 집중되어 있어, 컴포넌트가 직접 supabase를 부르는 game 서비스의 문제 패턴은 이 서비스에는 없다.
- `console.log` 디버그 로그가 남아 있다: `useCalcPersistence.ts:63,83` — "자동 저장 시작..."에 `roomId`를 그대로 찍는다(개선 백로그 P3-11에 기재된 항목).

## 5. 도메인 로직 메모

- **정산 알고리즘**(`useCalculator.ts`): 공통지출(`type === "COMMON"`)만 합산 → `perPersonShare = floor(총액 / 인원 / unit) * unit`(기본 10원 단위 절사) → `remainder = 총액 - perPersonShare * 인원` → 잔액은 **가장 많이 낸 사람**(`remainderReceiver`)에게 몰아줌 → 각 멤버의 `paid - perPersonShare` 잔액을 계산 → 양수(받을 사람)/음수(보낼 사람)로 나눠 정렬 → 두 포인터 그리디 매칭으로 최소 이체 목록 생성.
- 개인 지출(`PERSONAL`)은 정산 계산에서 완전히 제외되고 기록용으로만 목록에 남는다.
- **공유**: `ShareButton`이 정산 결과를 카톡 공유 포맷 문자열로 조립하고 `navigator.share`를 우선 시도, 미지원/실패 시 클립보드 복사로 폴백한다.

## 6. 알려진 제약 / 후속 과제

- `SettlementSummary.tsx`가 어디서도 사용되지 않는 죽은 컴포넌트로 보인다 — 삭제하거나 실제 화면에 연결할지 결정 필요.
- `Expense` 타입이 `types/index.ts`와 3개 파일에 중복 선언되어 있다 — 로컬 재선언 제거하고 공용 타입으로 통일 여지.
- **동시 편집 충돌 처리가 없다**: "스냅샷 전체 교체" 저장 방식이라 두 사람이 거의 동시에 지출을 추가하면 늦게 저장한 쪽이 앞선 변경을 덮어쓸 수 있다. realtime이 없어 결과도 새로고침 전까지 반영되지 않는다.
- `console.log` 디버그 로그 잔존(`useCalcPersistence.ts:63,83`) — 룸 ID가 콘솔에 노출된다. 개선 백로그 P3-11.
- **room 훅 중복**: `useCalcPersistence`(138줄)의 생성 로직은 meeting의 `useCreateRoom`과 거의 동일한 `slug`+`short_code` 발급·재시도 코드를 파일 단위로 복붙한 형태다 — 개선 백로그 P2-5(room 훅 5벌 통합 후보: `useRoom` 410줄 · `useGameRoom` 270줄 · `usePlaceVote` 240줄 · `useRoomActions` 157줄 · `useCreateRoom` 145줄)에 이 서비스의 생성/저장 로직도 사실상 포함되는 범위다.
- 변경 이력/되돌리기 기능이 없고, 송금 완료 여부를 체크하는 후속 액션 레이어도 없다(자세한 내용은 [menu-details/calc.md](../menu-details/calc.md) 참고).
