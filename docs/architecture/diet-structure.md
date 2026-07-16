# 체중 관리 서비스 구조 설계

> 2026-07-15 기준. 체중 관리(diet) 서비스의 도메인 모델, 화면 구조, 저장 아키텍처를 정리한다.
> 메뉴 관점 분석은 [menu-details/diet.md](../menu-details/diet.md), 전체 개선 항목은 [improvement-backlog.md](../improvement-backlog.md) 참고.

## 1. 서비스 개요

몸무게와 식단을 하루 3끼(아침/점심/저녁) 단위로 함께 기록하며 주간·월간 변화를 추적하는 건강 로그 도구.

- **목표(goal) 단위**: "이번 여름까지 -5kg!" 같은 목표를 하나 만들면 전용 상세 페이지(`/diet/[id]`)가 생성됨 — 계정북/워크아웃처럼 "방+비밀번호" 인증은 없고, id가 곧 접근 링크
- 하루 기록은 **끼니별 몸무게 + 식단 태그 + 메모**로 구성되며, 저장 시 전날 대비 변화량을 자동 계산해 보여줌
- 7개 파일뿐인 가장 작은 서비스 중 하나이며, 세 서비스 중 유일하게 **데이터 레이어(repository/service)가 없다** — 컴포넌트가 Supabase를 직접 호출

## 2. 화면·컴포넌트 구조

```text
app/diet/page.tsx                진입점 — 목표 이름/목표 몸무게 입력 → diet_goals insert → /diet/[id] 이동
app/diet/[id]/page.tsx           상세 진입점 — goal 조회 후 헤더 렌더 + DietMainContent 위임
                                  (로딩 상태만 Tailwind `className="p-10 text-center"`,
                                   나머지는 styled-components — 스타일 혼용 사례)
└── DietMainContent.tsx          메인 로직 — 날짜 이동, 주간/월간 로그 조회·저장, dirty check
    ├── WeightChart.tsx          라이브러리 없이 순수 SVG로 그린 체중 추이 차트(범례 토글 가능)
    ├── DietMealInput.tsx        끼니별 몸무게 입력 + 식단 태그 입력(공용 TagInput 재사용)
    └── AnalysisCard.tsx         전날 대비 변화량 카드(밤사이/낮동안/최종, 그램 단위)
```

핵심 훅: **없음.** 다른 두 서비스(workout/overtime)와 달리 이 서비스는 상태·조회·저장 로직을 별도 훅으로 분리하지 않고 `DietMainContent.tsx` 컴포넌트 안에 `fetchLogAndYesterday`/`fetchChartLogs`/`handleSave` 함수로 직접 구현한다. 파일 수가 적어 아직 분리 압력이 크지 않은 것으로 보인다.

## 3. 데이터 모델

전용 `types.ts` 파일이 없고, 컴포넌트 로컬 인터페이스로만 존재한다.

```ts
// DietMainContent.tsx 내부 정의
interface LogData {
  id?: number;
  date: string;                 // YYYY-MM-DD
  morning: string;              // 콤마(,) 구분 태그 문자열 — 배열 아님
  lunch: string;
  dinner: string;
  weight_morning: string;       // 문자열! 숫자가 아니라 자유 입력 텍스트로 저장
  weight_lunch: string;
  weight_dinner: string;
  memo: string;
}

// [id]/page.tsx — goal 조회 결과
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const [goal, setGoal] = useState<any>(null);  // { id, title, target_weight } 추정, 명시 타입 없음
```

- 식단은 `toTags`/`fromTags`(`DietMainContent.tsx`)로 콤마 문자열 ↔ 배열을 매번 변환 — 구조화된 컬럼이 아니라 자유 텍스트 직렬화.
- 몸무게 필드가 문자열이라 `WeightChart`/`AnalysisCard`에서 쓸 때마다 `parseWeight`(정규식 `[0-9]+(\.[0-9]+)?` 매칭)로 재파싱한다.

## 4. 저장 아키텍처

```text
[클라이언트]                              [서버 (Supabase)]
page.tsx / DietMainContent.tsx / [id]/page.tsx
  └→ import { supabase } from "@/lib/supabase"   (3개 파일 모두 직접 호출, 레포지토리 레이어 없음)
       ├→ diet_goals   .insert()  / .select().eq("id", id).single()
       └→ diet_logs    .select().eq("goal_id",...).eq("date",...).single()   (당일 + 전날 조회)
                        .select().gte("date", start).lte("date", end)         (주간/월간 차트용)
                        .upsert(payload, { onConflict: "goal_id, date" })     (저장)
```

- **테이블 추정** (SQL 마이그레이션 파일이 저장소에 없어 코드 호출부로만 역추적 가능 — [menu-details/diet.md](../menu-details/diet.md)도 동일하게 "DB 구조 추정"이라 명시):
  - `diet_goals`: `id`, `title`, `target_weight`
  - `diet_logs`: `goal_id`, `date`, `morning`/`lunch`/`dinner`, `weight_morning`/`weight_lunch`/`weight_dinner`, `memo` — `(goal_id, date)` 복합 유니크(upsert의 `onConflict` 기준)
- **데이터 레이어 부재**: `services/`나 `repository.ts`/`storage.ts` 없이 컴포넌트 3곳에서 `lib/supabase`를 바로 import — [improvement-backlog.md](../improvement-backlog.md) P2-4(데이터 레이어 컨벤션 통일 + ESLint 가드)가 지목하는 19개 컴포넌트 중 하나다.
- anon key 기반 설계의 트레이드오프는 다른 서비스와 동일하게 수용된 결정([ADR-001](../adr/ADR-001-hybrid-persistence-strategy.md) 참고).

## 5. 도메인 로직 메모

- **전날 대비 변화량 3종** (`DietMainContent.tsx` 인라인 계산, `AnalysisCard.tsx`가 표시):
  - `overnightDiff` = 오늘 아침 − 전날 저녁 (밤사이 변화)
  - `daytimeDiff` = 오늘 저녁 − 오늘 아침 (낮동안 변화)
  - `totalDiff` = 오늘 저녁 − 전날 저녁 (최종 변화)
  - 세 값 모두 `parseFloat` 실패 시 `null`로 처리되어 해당 카드가 조건부로 숨겨진다. `AnalysisCard`는 `totalDiff < 0`(감량)이면 초록, 아니면 빨강으로 색을 바꾸고 그램 단위(`Math.round(kg*1000)`)로 환산해 보여준다.
- **dirty check + 이탈 방지**: `isDirty = JSON.stringify(log) !== JSON.stringify(initialLog)`로 저장 안 된 변경을 감지. `beforeunload` 이벤트로 탭 닫기/새로고침을 막고, 날짜 이동(`handleDateMove`) 시에는 `openConfirm`으로 이동 여부를 재확인한다 — 저장하지 않은 하루치 입력이 조용히 사라지는 것을 막는 설계.
- **자체 SVG 차트**: `WeightChart.tsx`는 recharts 등 외부 차트 라이브러리 없이 `getX`/`getY`로 좌표를 직접 계산해 `<polyline>`을 그린다. 이 서비스가 3개 서비스 중 유일하게 자체 구현 차트를 쓰는 사례(workout은 `WorkoutCharts.tsx`에서 별도 구현체, account-book 등은 다른 방식) — 아침/점심/저녁 라인을 범례 클릭으로 개별 토글 가능.
- **주간/월간 뷰 전환**: `date-fns`(`startOfWeek`/`endOfWeek`/`startOfMonth`/`endOfMonth`, `weekStartsOn: 1`)로 범위를 계산해 `diet_logs`를 조회 — 워크아웃(`helpers.ts`가 직접 날짜 연산)과 달리 date-fns를 실제로 사용하는 몇 안 되는 서비스 중 하나.

## 6. 알려진 제약 / 후속 과제

- 데이터 레이어 부재 — [improvement-backlog.md](../improvement-backlog.md) P2-4의 대표 사례. `page.tsx`, `DietMainContent.tsx`, `[id]/page.tsx` 3곳 모두 컴포넌트에서 `lib/supabase`를 직접 import한다. 서비스 규모가 작아 아직 체감 비용은 낮지만, ESLint `no-restricted-imports` 가드가 이미 다른 서비스에 적용된 만큼 이 서비스도 경고 대상이다.
- `app/diet/[id]/page.tsx:30`의 로딩 상태만 Tailwind(`className="p-10 text-center"`)이고 나머지는 전부 styled-components — [improvement-backlog.md](../improvement-backlog.md) P3-12(스타일 혼용 9파일)에 명시적으로 언급된 사례.
- 몸무게가 문자열 컬럼으로 저장되어 정렬·집계·차트 렌더 시마다 정규식 재파싱이 필요하다 — 숫자 컬럼(`numeric`) 전환 여지가 있다.
- `goal` 상태가 `any` 타입(`[id]/page.tsx:16`, eslint-disable 처리됨) — 명시적 인터페이스가 없다.
- SQL 마이그레이션 파일이 저장소에 없어 `diet_goals`/`diet_logs` 스키마 변경 이력을 추적할 수 없다.
- [menu-details/diet.md](../menu-details/diet.md)의 "10. 한계"에서 이미 지적된 항목과 연결됨: 운동·수면·컨디션 같은 주변 지표 부재, 식단이 자유 텍스트라 구조화 분석이 약함, 공유/코칭/회고 기능 없음(다른 서비스처럼 방 공유 개념이 없어 개인 링크로만 접근).
