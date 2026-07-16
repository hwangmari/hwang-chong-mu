# 인바디(inbody) 서비스 구조 설계

> 2026-07-15 기준. 인바디(inbody) 서비스의 도메인 모델, 화면 구조, 저장 아키텍처를 정리한다.
> 전체 개선 항목은 [improvement-backlog.md](../improvement-backlog.md) 참고.
>
> ⚠️ `docs/menu-details/`에는 inbody 대응 문서가 없다(README·목록에 미등재). 메뉴 관점 분석이 필요하면 이 문서가 유일한 근거다.

## 1. 서비스 개요

체성분(인바디) 측정값을 기록하고 지표별 추이를 스파크라인으로 보여주는 개인 수첩형 서비스. 6개 파일로 프로젝트에서 가장 작은 축에 속하는 서비스다.

- 별도 로그인 체계가 없다 — **`workout`(운동 일지) 서비스의 방(room) 세션을 그대로 재사용**한다. `inbody_records.room_id`가 `workout_rooms.id`를 참조하므로 "운동방 로그인 = 인바디방 로그인"
- 지표 8종(체중·골격근량·체지방량·BMR·BMI·체지방률·복부지방률·내장지방레벨)을 기록, 지표별로 표시 여부를 토글하고 직전 기록 대비 증감(delta)과 좋은/나쁜 방향을 색으로 표시
- 별도 목록/상세 페이지 분리 없이 `page.tsx` 하나가 입력 폼·추이 카드·기록 리스트를 전부 렌더링

## 2. 화면·컴포넌트 구조

```text
app/inbody/layout.tsx                  WorkoutAuthGate로 children 감싸기 — 세션 없으면 방 생성/참가 폼, 있으면 통과
└── app/inbody/page.tsx                단일 페이지: 입력 폼 + 지표별 추이 카드 그리드 + 측정 기록 리스트
    └── components/InBodySparkline.tsx  지표 1개당 SVG 스파크라인 (외부 차트 라이브러리 없이 직접 렌더)

app/inbody/repository.ts               원격 데이터 계층 — Supabase CRUD (fetch/upsert/delete)
app/inbody/storage.ts                  로컬 전용 계층 — 표시 지표 선택값(localStorage), ID 생성, 오늘 날짜 문자열
app/inbody/types.ts                    InBodyRecord 타입 + 지표별 설정 맵(라벨/단위/색/소수자리/step/좋은방향)
app/inbody/supabase-schema.sql         inbody_records 테이블 DDL + RLS 정책 (마이그레이션 SQL, 코드에서 직접 실행 안 됨)
```

핵심 훅/함수 (파일이 적어 서비스 전용 커스텀 훅은 없음):

| 함수 | 위치 | 역할 |
|---|---|---|
| `useWorkoutSession` | app/workout/useWorkoutSession.ts | `useSyncExternalStore`로 localStorage 세션(roomId+password)을 구독 — inbody가 그대로 가져다 씀 |
| `fetchInBodyRecords` / `upsertInBodyRecord` / `deleteInBodyRecord` | repository.ts | 방 단위 CRUD, 정렬은 날짜 desc → 생성일 desc |
| `loadVisible` / `saveVisible` | storage.ts | 화면에 표시할 지표 집합을 localStorage(`hcm:inbody:visible`)에 저장 — 저장은 모든 지표가 되고 표시만 선택적 |
| `todayISO` | storage.ts | `utils/date.ts`의 `formatDateKey`를 재사용해 오늘 날짜(YYYY-MM-DD) 반환 |

## 3. 데이터 모델

`app/inbody/types.ts`의 `InBodyRecord`가 중심. 지표 키마다 설정을 `Record<InBodyMetricKey, T>` 맵 5개로 병렬 관리한다(라벨/단위/색/증감 좋은방향/입력 step/소수자리).

```ts
type InBodyMetricKey =
  | "weight" | "skeletalMuscle" | "bodyFatMass" | "bmr"
  | "bmi" | "bodyFatPct" | "abdominalFatRatio" | "visceralFatLevel";

type InBodyRecord = {
  id: string;
  roomId: string;            // workout_rooms.id — 운동방과 공유하는 접근 단위
  date: string;               // YYYY-MM-DD
  weight?: number;
  skeletalMuscle?: number;
  bodyFatMass?: number;
  bmr?: number;
  bmi?: number;
  bodyFatPct?: number;
  abdominalFatRatio?: number;
  visceralFatLevel?: number;
  memo?: string;
  createdAt: string;
};

// 좋은/나쁜 방향: delta 색상 배지에 사용 (up=증가가 좋음, down=감소가 좋음, neutral=단순표시)
const METRIC_GOOD_DIRECTION: Record<InBodyMetricKey, "up" | "down" | "neutral"> = {
  weight: "neutral", skeletalMuscle: "up", bodyFatMass: "down", bmr: "up",
  bmi: "neutral", bodyFatPct: "down", abdominalFatRatio: "down", visceralFatLevel: "down",
};
```

DB 테이블(`supabase-schema.sql`)은 이 타입을 snake_case로 그대로 반영한 단일 테이블 `inbody_records` 하나뿐 — account-book처럼 여러 테이블/RPC로 분산되지 않는다.

## 4. 저장 아키텍처 — 클라이언트 → Supabase 직접 접근 (API 라우트·RPC 없음)

schedule(서버 세션+REST API)이나 account-book(RPC 경유)과 달리, inbody는 **`app/api/` 라우트를 거치지 않고 클라이언트 컴포넌트에서 `@/lib/supabase`(anon key)로 직접 CRUD한다.**

```text
[클라이언트]
app/inbody/page.tsx ("use client")
  └→ repository.ts (fetchInBodyRecords / upsertInBodyRecord / deleteInBodyRecord)
        └→ supabase.from("inbody_records").select|upsert|delete(...)   ── anon key, RLS 통과
```

- **접근 제어는 앱 레이어 하나뿐**: `layout.tsx`의 `WorkoutAuthGate`가 localStorage에 `roomId`+`password`가 있는지만 확인하고 통과시킨다. 서버 측에서 요청마다 비밀번호를 재검증하는 절차가 없다
- **RLS는 완전 개방**: `supabase-schema.sql`의 정책은 `using (true) with check (true)` — anon key만 있으면 `room_id`를 몰라도 임의로 조회/수정/삭제가 가능하다. 실제 접근 통제는 "방 비밀번호를 알아야 UI에 roomId가 채워진다"는 클라이언트 관례에만 의존한다. 이는 `workout` 서비스와 동일한 패턴이며, [Supabase anon-key 설계](../adr/ADR-001-hybrid-persistence-strategy.md) 트레이드오프의 연장선으로 수용된 설계다
- **localStorage 사용**: `storage.ts`가 담당하는 건 도메인 데이터가 아니라 UI 설정(표시 지표 선택)뿐. 실제 측정 기록은 전부 Supabase에 있고 클라이언트 캐시/폴백이 없다 — account-book처럼 네트워크 실패 시 localStorage로 폴백하는 로직은 없다

### 필드 추가 시 손대야 할 지점 (지표 1종 추가 기준)

새 지표를 추가하려면 다음을 모두 고쳐야 한다(단일 화이트리스트는 아니지만 5곳 병렬 수정이 필요하다는 점에서 account-book과 유사한 실수 유발 지점):

1. `types.ts` — `InBodyMetricKey` 유니온, `METRIC_KEYS` 배열, `METRIC_LABEL`/`METRIC_UNIT`/`METRIC_COLOR`/`METRIC_GOOD_DIRECTION`/`METRIC_STEP`/`METRIC_DECIMALS` 6개 맵
2. `InBodyRecord` 타입에 필드 추가
3. `repository.ts`의 `RecordRow`(snake_case), `mapRow`, `upsertInBodyRecord`의 payload 객체
4. `supabase-schema.sql`에 컬럼 추가(+ 실제 배포 환경 DB에 마이그레이션 SQL 별도 실행)
5. `page.tsx`의 `FormState`, `emptyForm()`, `submit()`의 `numbers` 객체, `editRecord()`의 필드 매핑

## 5. 주요 도메인 로직 메모

- **증감 톤 계산**: 최신값-직전값 delta를 구하고, `METRIC_GOOD_DIRECTION`에 따라 `good`(초록)/`bad`(빨강)/`neutral`(회색) 3톤으로 배지 표시. 추이 카드(`latest` vs `previous`, records[0]/[1])와 기록 리스트 각 행(해당 행 vs 바로 다음 행)에서 각각 독립적으로 계산 — 로직 중복이지만 두 곳 다 20줄 내외로 간단
- **숫자 파싱 방어**: Supabase 응답이 `numeric` 컬럼을 문자열로 반환할 수 있어 `toNumber()`가 `string | number | null` 모두 받아 `Number()` 변환 후 `Number.isFinite` 체크. `bmr`/`visceral_fat_level`만 `integer` 컬럼이라 이 변환 없이 그대로 사용
- **스파크라인은 자체 SVG 구현**: 외부 차트 라이브러리 없이 `InBodySparkline.tsx`가 min-max 정규화 후 `<path>` d 속성을 직접 문자열로 생성(240x56 viewBox, 포인트 1개면 점만, 2개 이상이면 라인+그라데이션 영역)
- **저장 시 항상 전체 지표 유지**: `visible`(표시 여부)과 실제 저장 데이터는 분리되어 있다 — 특정 지표를 화면에서 숨겨도 그 값이 기록되어 있으면 저장 시 유지된다("저장은 모든 지표가 됩니다" 안내 문구가 UI에 명시됨)
- **최소 1개 지표 필수**: `submit()`은 8개 지표 중 하나라도 값이 있어야 저장을 허용, 전부 빈 값이면 에러 메시지만 띄우고 반려

## 6. 알려진 제약 / 후속 과제

- **`repository.ts`/`storage.ts` 명명 예시**: [improvement-backlog.md](../improvement-backlog.md) 4번 항목이 지적하는 "데이터 레이어 명명 3중 혼재"의 실제 사례. 여기서는 `repository.ts`=원격 CRUD, `storage.ts`=로컬 UI 설정으로 역할이 명확히 나뉘어 있지만, daily·account-book·workout 등 다른 서비스에서는 같은 파일명이 다른 의미로 쓰인다(예: account-book의 `storage.ts`는 로컬 설정이 아니라 RPC 응답 정규화+localStorage 폴백까지 담당). 파일명만 보고 역할을 추측할 수 없다는 것이 문제의 핵심
- **`formatDateKey` 중복은 이미 해소됨**: 개선 백로그 9번 항목은 "YYYY-MM-DD 수작업 포맷이 `inbody/storage.ts:39`에 중복 구현"이라고 기록하고 있으나, 현재 코드는 `todayISO()`가 `utils/date.ts`의 `formatDateKey`를 import해 사용 중이다(중복 없음) — 백로그 문서가 실제 코드보다 며칠 앞서 있어 이 항목은 갱신이 필요하다
- **RLS 전면 개방**: `using (true) with check (true)` 정책이라 anon key를 아는 클라이언트는 UI를 거치지 않고도 다른 방의 `room_id`를 추측/열거해 기록을 읽거나 수정할 수 있다. 방 비밀번호는 클라이언트 로컬 검증에만 관여하고 서버(Supabase)단에서 재검증되지 않는다. 프로젝트 전반의 수용된 트레이드오프이지만, 인바디는 개인 건강 데이터라는 민감도를 고려하면 다른 서비스보다 우선순위가 높을 수 있다
- **`workout` 서비스에 대한 하드 의존**: 세션 훅(`useWorkoutSession`)과 스토리지 키(`workout/storage.ts`)를 직접 import한다. `workout` 내부 구현이 바뀌면 inbody도 함께 깨지는데, 이 의존 관계는 코드 주석(`supabase-schema.sql` 상단)에만 언급되어 있고 타입 레벨의 계약은 없다
- **자동화 테스트 없음**: 다른 서비스와 동일하게 이 서비스도 테스트가 없어 지표 추가/수정 시 5곳 병렬 수정(4절 체크리스트)이 수작업 검증에 의존한다
