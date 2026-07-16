# 습관 관리 서비스 구조 설계

> 2026-07-15 기준. 습관 관리(habit) 서비스의 도메인 모델, 화면 구조, 저장 방식을 정리한다.
> 메뉴 관점 분석은 [menu-details/habit.md](../menu-details/habit.md), 전체 개선 항목은 [improvement-backlog.md](../improvement-backlog.md) 참고.

## 1. 서비스 개요

목표(습관) 단위의 "방"을 만들고, 그 안에서 여러 체크리스트 항목을 매일 체크하는 트래커. 월간 히트맵 캘린더, 날짜별 댓글, 월간 랭킹으로 가벼운 동기부여 요소를 곁들였다.

- **목표(goal) 생성**: 제목 + 이모지 + 테마 컬러로 방을 하나 만듦 (`/habit` → `/habit/[id]`)
- **습관 항목(goal_items)**: 목표 하나에 여러 체크리스트 항목을 추가/삭제
- **완료 로그(goal_logs)**: 항목 × 날짜 단위로 완료 여부를 기록
- 인증/멤버 개념 없이 URL(goal id)만으로 접근하는 오픈 방 구조 — account-book·daily처럼 접근 코드나 초대 코드가 없다

## 2. 화면·컴포넌트 구조

```text
app/habit/page.tsx                    생성 페이지 (제목/이모지/테마 컬러 → goals insert)
└── app/habit/[id]/page.tsx           상세 진입 — goal 단건 조회 후 MonthlyTracker 렌더
    └── MonthlyTracker.tsx            상태 허브 — 좌: 달력+체크리스트 / 우: 댓글+랭킹
        ├── useMonthlyTracker.ts      월/일 상태, 항목·로그 CRUD (핵심 훅)
        ├── CalendarGrid.tsx          월간/주간 히트맵 캘린더 (완료율 색상 그라데이션)
        ├── TodoList.tsx              선택일 체크리스트 (추가/삭제/토글, 진행률 바)
        ├── CommentSection.tsx        날짜별 댓글 — ⚠️ supabase 직접 호출 (아래 3항 참고)
        └── HabitRanking.tsx          월 누적 완료 랭킹 (막대 그래프, 접기/펼치기)
```

핵심 훅은 사실상 하나뿐이다:

| 훅 | 역할 |
|---|---|
| `useMonthlyTracker` | 현재월/선택일/주말표시/hover 상태 + `goal_items`·`goal_logs` CRUD 전부 담당 |

`isExpanded`(달력 펼침), `showRanking`(랭킹 토글)은 `MonthlyTracker.tsx` 로컬 상태로 남아 있어 훅으로 승격되지 않았다.

## 3. 데이터 모델

`useMonthlyTracker.ts`의 `GoalItem`이 중심:

```ts
export interface GoalItem {
  id: number;
  title: string;
  goal_id: number;
}
```

- 로그는 `{ item_id: number; completed_at: string }` 형태로 별도 상태(`rawLogs`)에 보관하고, `monthlyLogs`(날짜별 count)로 집계해 캘린더에 넘긴다
- 댓글은 `types.ts`의 `GoalComment` (goal_id, record_date, nickname, content)

### 테이블 (추정 — RPC 스키마 없이 테이블 직접 CRUD)

- `goals` — 목표(방) 메타: title, emoji, color
- `goal_items` — 목표별 체크리스트 항목
- `goal_logs` — 항목 × 날짜 완료 로그 (`item_id`, `completed_at`)
- `goal_comments` — 날짜별 댓글 (`goal_id`, `record_date`, `nickname`, `content`, `created_at`)

## 4. 저장 아키텍처

account-book·daily와 달리 **RPC 레이어가 없다.** `useMonthlyTracker`와 `CommentSection` 모두 `@/lib/supabase`의 `supabase.from(...)`을 컴포넌트/훅에서 직접 호출한다.

```text
useMonthlyTracker.ts  → supabase.from("goal_items"|"goal_logs")  (조회/추가/삭제/토글)
CommentSection.tsx    → supabase.from("goal_comments")           (조회/등록/삭제)
```

### ⚠️ `CommentSection.tsx`의 직접 호출

`useMonthlyTracker`가 데이터 로직을 어느 정도 모아두긴 했지만, `CommentSection.tsx`는 훅을 거치지 않고 컴포넌트 안에서 `fetchComments`/`handleSubmit`/`handleDelete`가 각각 `supabase.from("goal_comments")`를 직접 호출한다. 이는 개선 백로그의 [데이터 레이어 컨벤션 가드](../improvement-backlog.md)(`no-restricted-imports` warn, `lib/supabase` 직접 import 시 경고)가 겨냥하는 전형적인 사례다.

## 5. 도메인 로직 메모

- **에러 처리 보강 (2026-07-14 반영)**: `fetchGoalItems`/`fetchMonthlyLogs`/`fetchDailyLogs`가 각각 error를 검사해 실패 시 상태를 비우고 조기 반환하도록 정리됨. `addItem`/`deleteItem`/`toggleComplete`도 실패 시 `openAlert`로 사용자에게 알리고 낙관적 업데이트를 롤백한다 (improvement-backlog P1-2 대응)
- **`loading` 플래그**: 최초 `fetchGoalItems` 완료 전까지 `MonthlyTracker`가 "불러오는 중..." 화면을 보여준다. `cancelled` 플래그로 언마운트 이후 setState를 막는다
- **주말 표시 설정**: `showWeekends`는 goal별로 `localStorage["showWeekends_<goalId>"]`에 저장되어 사용자 선호가 유지된다 (habit 서비스에서 유일하게 localStorage를 쓰는 지점)
- **hover 연동**: `TodoList`의 항목에 마우스를 올리면 `hoveredItemId`가 세팅되고, `CalendarGrid`가 해당 항목이 완료된 날짜만 강조하고 나머지는 회색으로 낮춘다
- **히트맵 색상 단계**: `CalendarGrid.getCellStyles`가 완료율(`count / totalItemsCount`)을 0.3/0.6/1 구간으로 나눠 테마 컬러의 투명도를 단계적으로 올린다
- `app/habit/opengraph-image.tsx`로 소셜 공유용 OG 이미지를 라우트 핸들러로 생성한다

## 6. 알려진 제약 / 후속 과제

- `CommentSection.tsx`가 데이터 레이어 컨벤션을 벗어나 supabase를 직접 호출 — 훅으로 흡수하거나 최소한 gateway 함수로 감쌀 여지가 있다
- RPC/RLS 없이 테이블 직접 CRUD — anon key 기반 설계의 트레이드오프이지만, account-book·daily처럼 서버 측 권한 검증 계층이 없다
- 접근 코드/초대 코드가 없어 goal id(숫자)만 알면 누구나 조회·수정 가능한 오픈 구조
- 장기 통계(streak, best month 등)나 습관 카테고리 분류 기능은 없다 — [menu-details/habit.md](../menu-details/habit.md) 개선 제안 참고
