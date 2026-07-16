# 운동 기록 서비스 구조 설계

> 2026-07-15 기준. 운동 기록(workout) 서비스의 도메인 모델, 화면 구조, 저장 아키텍처를 정리한다.
> 메뉴 관점 분석 문서(menu-details)는 아직 없음. 전체 개선 항목은 [improvement-backlog.md](../improvement-backlog.md) 참고.

## 1. 서비스 개요

러닝·웨이트(헬스)·기타 활동(자전거·등산·테니스 등) 기록을 한 방(room)에 모아 성장 그래프로 보여주는 운동 수첩.

- **방 이름 + 비밀번호** 인증 — 계정 개념 없이 방 하나가 곧 사용자(또는 공유 그룹) 단위
- 3개 도메인(러닝/헬스/활동)이 각자 독립 테이블·CRUD를 갖되, 홈 화면에서 하나로 합쳐 보여줌
- 러닝·헬스 기록은 OCR(이미지 인식)로 사진 한 장에서 자동 채움 가능
- 헬스는 무게×횟수(`weightReps`) 세트가 기본이지만, 매달리기·플랭크처럼 버틴 시간을 재는 운동을 위한 `time` 측정 모드가 있음 (2026-07-13 추가)

## 2. 화면·컴포넌트 구조

```text
app/workout/layout.tsx                 진입점 — WorkoutShell로 children 래핑
├── components/WorkoutShell.tsx        WorkoutAuthGate + WorkoutSubNav + 컨텐츠 래퍼
│   ├── WorkoutAuthGate.tsx            세션 없으면 방 만들기/입장 폼 렌더, 있으면 children 통과
│   └── WorkoutSubNav.tsx              홈/러닝/웨이트/활동 탭 + 방 이름 표시 + 나가기 버튼
├── page.tsx                           홈 — CTA(러닝/웨이트/활동 바로가기), 월간 캘린더,
│                                       최근 기록 5건, 러닝 PR, 헬스 Top PR(부위 필터), 잔디 히트맵
├── run/page.tsx (1,167줄)              러닝 기록 CRUD 폼 + OCR + 인터벌 상세 + 월별 아코디언 목록
├── weight/page.tsx (2,168줄)           헬스 기록 CRUD 폼 + OCR + 루틴 저장/불러오기 + 월별 목록
│                                       (서비스 내 최대 파일)
└── activity/page.tsx (544줄)           기타 활동 CRUD 폼 + 월별 목록

app/workout/components/
├── MonthAccordion.tsx                 제네릭 월별 아코디언 UI + useExpandedMonths 훅
│                                       (run/weight/activity 3곳에서 공유)
├── WorkoutCharts.tsx (1,936줄)         차트 5종 export (아래 5장 참고)
└── WorkoutSharedStyles.ts             페이지 공용 styled 컴포넌트(StPage/StCard/StEmpty 등)
```

핵심 훅·모듈:

| 파일 | 역할 |
|---|---|
| `useWorkoutSession.ts` | `useSyncExternalStore`로 localStorage 세션(`roomId`/`roomName`/`password`) 구독 |
| `storage.ts` | 세션 read/write/clear + `window` 이벤트(`workout-session-change`)로 탭 간 동기화 |
| `repository.ts` | 러닝/헬스/루틴/활동 CRUD, Supabase row ↔ TS 타입 매퍼 |
| `helpers.ts` | 포맷(시간·페이스), 볼륨/PR 계산, 월별 그룹핑, 스트릭, 잔디 히트맵 집계 |
| `ocr.ts` | tesseract.js OCR 실행 + Apple Fitness/트레드밀/제네릭 3종 파서 |
| `MonthAccordion.tsx`의 `useExpandedMonths` | 월별 아코디언 펼침 상태(기본값: 이번 달만 열림) |

## 3. 데이터 모델

`app/workout/types.ts` 기준. 도메인 3종 + 부속 타입:

```ts
type RunningRecord = {
  id: string; roomId: string; date: string;
  runType: RunningType;              // zone2 | interval | lsd | tempo | easy | race | other
  environment: RunningEnvironment;   // outdoor | indoor
  distanceKm: number; durationSec: number;
  avgPaceSec?: number; avgHeartRate?: number; avgCadence?: number; calories?: number;
  intervals?: RunningInterval[];     // 구간별 기록 (실외: 거리 기준 / 실내: 속도·경사 기준)
  memo?: string; createdAt: string; updatedAt: string;
};

type GymExercise = {
  id: string; name: string;
  equipment?: GymEquipment;          // dumbbell | barbell | kettlebell | plate | cable | medicineball
  sideCount?: number;                // 양쪽 합산 계수 (덤벨·레그프레스 등은 2, 미지정 시 1)
  barWeight?: number;                // 빈 바벨 무게(kg) — 원판 입력값에 자동 합산
  measure?: GymMeasure;              // weightReps(기본) | time — 매달리기 등 시간 기록 운동
  note?: string;
  sets: GymSet[];
};

type GymSet = {
  id: string; weight: number; reps: number;
  durationSec?: number;              // measure === "time"일 때 버틴 시간(초)
  type: GymSetType;                  // normal | warmup | drop | failure
  dropSets?: GymDropSet[];
  note?: string;
};

type GymRecord = {
  id: string; roomId: string; date: string;
  bodyPart?: GymBodyPart; durationMin?: number; calories?: number; avgHeartRate?: number;
  exercises: GymExercise[]; memo?: string; createdAt: string; updatedAt: string;
};

type ActivityRecord = {
  id: string; roomId: string; date: string; activityName: string;
  durationMin?: number; calories?: number; avgHeartRate?: number;
  memo?: string; createdAt: string; updatedAt: string;
};

type WorkoutRoutine = {  // 자주 쓰는 웨이트 세트 묶음 저장/불러오기
  id: string; roomId: string; name: string; bodyPart?: GymBodyPart;
  exercises: GymExercise[]; createdAt: string; updatedAt: string;
};
```

- `measure`/`sideCount`/`barWeight`는 모두 optional — 미지정 시 각각 `weightReps`/`1`/`0`으로 간주해 **이전 기록과 호환**된다.
- 파생 통계 타입: `WeeklySummary`, `ExercisePR`(시간 기록 운동은 `durationSec`만 채워짐, `reps: 0`), `RunningBest`.

## 4. 저장 아키텍처

```text
[클라이언트]                              [서버 (Supabase)]
useWorkoutSession (useSyncExternalStore)
  └→ storage.ts localStorage("hwang-workout-session")
       └→ readWorkoutSession: raw 문자열 동일하면 캐시된 파싱 결과 재사용
          (getSnapshot 참조 동일성 보장 — useSyncExternalStore 요구사항)

repository.ts (컴포넌트에서 직접 호출, 별도 RPC 레이어 없음)
  └→ supabase.from("workout_running_records" | "workout_gym_records"
                      | "workout_routines" | "workout_activity_records")
       .select/.insert/.upsert/.delete  ──→ 테이블 4종 (workout_rooms 제외)
```

- **인증**: `workout_rooms` 테이블에 `name`+`password`를 평문으로 저장, `joinWorkoutRoom`이 `.eq("name", ...).eq("password", ...)`로 클라이언트에서 직접 대조. 서버 측 별도 인증 함수(RPC) 없음 — 가계부(`account_book_*` RPC 11개)보다 단순한 구조.
- **RLS**: `supabase-schema.sql`의 모든 테이블이 `using (true) with check (true)` — anon key가 모든 행에 접근 가능한 완전 개방 정책. room 격리는 클라이언트가 항상 `room_id`로 필터링하는 관례에만 의존한다. anon key 기반 설계의 트레이드오프는 수용된 결정([ADR-001](../adr/ADR-001-hybrid-persistence-strategy.md) 참고).
- **스키마 소스**: `app/workout/supabase-schema.sql`에 `create table if not exists` + `alter table add column if not exists`로 멱등하게 관리 — 별도 `supabase/` 마이그레이션 폴더를 쓰는 계정부와 달리 서비스 폴더에 스키마 전체를 보관하는 방식.
- **ID 생성**: `createWorkoutId()` — `crypto.randomUUID()` 우선, 미지원 환경은 `Math.random()` 폴백.

## 5. 도메인 로직 메모

- **볼륨 계산** (`setVolumeKg`): `(원판무게 × sideCount + barWeight) × reps`. 드랍셋도 동일 공식으로 합산 후 본세트에 더함. `gymRecordVolumeKg`는 `measure === "time"`인 운동을 볼륨 집계에서 제외한다(무게·횟수가 의미 없으므로).
- **PR 계산** (`computeExercisePRs`, `helpers.ts`): 운동 이름별 최고 기록을 `Map`으로 추적하되 측정 방식에 따라 분기.
  - `weightReps`: `plate × sideCount + barWeight`(유효 무게) 최대값 → 동률이면 reps 큰 쪽. 원판 0(맨몸)이면 PR 대상에서 제외.
  - `time`: `durationSec` 최대값이 PR. `weight`는 참고용(중량 매달리기 등), `reps`는 항상 0.
  - 두 분기 모두 `warmup` 세트는 제외.
- **시간 기록 운동(`measure: "time"`)**: 2026-07-13 추가. `weight/page.tsx`의 `StTimeChip` 토글로 운동별 전환하며, 켜지면 세트 입력 UI가 "무게(선택)+시간(초)"로 바뀌고 드랍셋 옵션은 숨겨진다(`ex.sets.type !== "drop"` 필터). 리스트 표시(`isTime` 분기, `weight/page.tsx:1245` 부근)와 PR/볼륨 계산(`helpers.ts`) 양쪽에서 별도 처리하므로, 향후 세 번째 measure를 추가한다면 두 지점(계산 로직 + 리스트 렌더) 모두 갱신이 필요하다.
- **OCR** (`ocr.ts`): tesseract.js dynamic import(`await import("tesseract.js")`)로 초기 번들 오염 방지. `detectSource()`가 정규식 휴리스틱(KCAL+SPM/BPM → Apple Fitness, KM/H·경사도 → 트레드밀)으로 소스를 추정한 뒤 전용 파서로 라우팅. 세 파서(`parseAppleFitness`/`parseTreadmill`/`parseGeneric`) 모두 정규식 기반이라 화면 UI 문구가 바뀌면 깨지기 쉽다.
- **활동 이모지 매칭** (`getActivityEmoji`, `types.ts`): 40여 종목 → 이모지 맵을 우선 정확 매칭, 실패 시 부분 문자열 포함(`name.includes(key)`)으로 폴백 — "산악자전거" → 자전거, "실내클라이밍" → 클라이밍처럼 프리셋 외 자유 입력도 대응.
- **운동 잔디 히트맵** (`buildWorkoutCalendar`): 최근 N주(기본 52주)를 월요일 시작 주 단위로 컬럼화, 하루 기록 개수로 강도(0~3) 계산. `currentWorkoutStreak`는 오늘 기록이 없어도 어제까지 이어졌으면 스트릭을 유지한다(오늘 하루 안 빠뜨려도 됨).
- **날짜 포맷 통합 완료**: `helpers.ts`가 `@/utils/date`의 `formatDateKey`를 import해서 씀 — 개선 백로그 P2-9(날짜 포맷 중복 4곳 중 하나로 지목됨)는 이 파일에서 이미 반영된 상태.

## 6. 알려진 제약 / 후속 과제

- `weight/page.tsx`(2,168줄)와 `components/WorkoutCharts.tsx`(1,936줄)가 코드베이스 전체에서 가장 큰 두 파일 — 대형 파일 분해([improvement-backlog.md](../improvement-backlog.md) P2-6) 최우선 대상. `weight/page.tsx`는 폼 상태·OCR·루틴·렌더가 한 컴포넌트에 몰려 있다.
- 방 인증이 평문 비밀번호 클라이언트 대조 + RLS 전면 개방(anon all) 조합이라, 가계부의 RPC(`SECURITY DEFINER`) 기반 서버 검증보다 보안 수준이 낮다. 토이 프로젝트 성격상 수용된 설계이지만 별도 RPC 레이어 도입 여지는 있다.
- `repository.ts`가 컴포넌트에서 직접 import되어 사용됨 — 서비스 레이어 명명이 `repository.ts`로 통일되어 있어(가계부·데일리·인바디와 동일 패턴) 개선 백로그 P2-4(데이터 레이어 컨벤션 통일)의 참조 후보 중 하나.
- OCR 파서는 세 소스(Apple Fitness/트레드밀/제네릭) 전용 정규식이라, 새 기기·앱 포맷 지원 시 파서 추가가 필요하고 회귀 테스트가 없어 수동 검증에 의존한다.
