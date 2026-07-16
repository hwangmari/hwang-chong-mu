# 야근 계산기 서비스 구조 설계

> 2026-07-15 기준. 야근 수당(보상휴가) 계산기(overtime) 서비스의 도메인 모델, 화면 구조, 저장 아키텍처를 정리한다.
> 메뉴 관점 분석 문서(menu-details)는 아직 없음. 전체 개선 항목은 [improvement-backlog.md](../improvement-backlog.md) 참고.

## 1. 서비스 개요

야근 시간을 입력하면 회사 보상휴가 규칙에 따라 적립 일수를 계산해 주는 도구. "계산기"(1회성 미리보기)와 "기록"(월별 누적 관리) 두 탭으로 구성된다.

- **규칙 2종**을 선택 가능: "15시간 이후, 10시 이후 2배" / "18:30부터 10분 단위 1.5배" — 회사마다 다른 산정 기준을 상수로 표현
- **저장은 이중 모드**: 기본은 localStorage(개인용), 방 코드를 만들거나 입력하면 Supabase 서버 저장으로 전환해 다른 사람과 기록을 공유
- 계정북·운동 기록과 달리 **OCR을 사용하지 않는다** — 순수 시간 입력 폼 기반 계산기라 이미지 인식이 필요 없는 도메인

## 2. 화면·컴포넌트 구조

```text
app/overtime/page.tsx                    진입점 — 규칙 선택 상태, 탭 전환, 훅 3개(storage/view/forms) 조립
├── components/RuleSelector.tsx          규칙 전환 탭(threshold_15h / from_1830)
├── components/CalculatorTab.tsx         계산기 탭 — 시간 입력 → 1회성 요약 미리보기
│   └── TargetGuideCard.tsx              목표 일수 선택 시 부족한 시간 안내 (계산기/기록 탭 공용)
├── components/RecordsTab.tsx            기록 탭 — 월별 누적 관리
│   ├── MonthlySummaryStats.tsx          월 누적 요약 통계 + TargetGuideCard
│   ├── OvertimeCalendar.tsx             월 캘린더 (주말 토글, 날짜 셀 클릭)
│   ├── SelectedDayPanel.tsx             선택 날짜의 빠른 입력/수정 폼 + 해당일 기록 목록
│   ├── MonthlyRecordsAccordion.tsx      월 전체 기록 아코디언(펼침/접힘)
│   │   └── RecordItemRow.tsx            개별 기록 행 (수정/삭제 버튼)
│   └── StorageModeCard.tsx              로컬/서버 저장 전환 + 방 생성·연결·해제·코드 복사
└── components/RuleGuideAccordion.tsx    선택 규칙의 "N일 채우려면 몇 시간" 가이드 표 (더보기)

app/overtime/components/styles.ts (912줄)  전 컴포넌트가 공유하는 통짜 styled-components 파일
```

핵심 훅:

| 훅 | 위치 | 역할 |
|---|---|---|
| `useOvertimeStorage` | `app/overtime/useOvertimeStorage.ts` | local/server 저장 모드 전환, 방 생성/연결/해제/코드 복사, `persistRecords` 단일 진입점 |
| `useOvertimeView` | `app/overtime/useOvertimeView.ts` | 현재 월 상태, 월별 필터링·요약(`buildOvertimeSummary`), 캘린더 주차 빌드, 목표일수 가이드 |
| `useOvertimeForms` | `app/overtime/useOvertimeForms.ts` | 계산기 폼 + 빠른입력(퀵애드) 폼 상태, 시/분 정규화, 저장·수정 진입 |
| `useOvertimePersistence` | `hooks/useOvertimePersistence.ts` | 서버 모드 전용 — Supabase CRUD(방 생성/조회, 레코드 일괄 교체) |

`page.tsx`는 이 4개 훅의 반환값을 프롭으로 엮어 `CalculatorTab`/`RecordsTab`에 전달하는 조립 역할만 한다 — 로직 자체는 훅에, 렌더는 하위 컴포넌트에 있다.

## 3. 데이터 모델

`app/overtime/types.ts` 기준:

```ts
type OvertimeRecord = {
  id: string;
  date: string;               // YYYY-MM-DD
  before10Minutes: number;    // 밤 10시 이전 야근 분
  after10Minutes: number;     // 밤 10시 이후 야근 분
  createdAt: string;
};

interface OvertimeRule {
  id: "threshold_15h" | "from_1830";
  thresholdMinutes: number;                    // 적립 시작 전 소진해야 하는 누적 분(무보상 구간)
  before10RewardSecondsPerMinute: number;       // 10시 전 1분당 보상 초
  after10RewardSecondsPerMinute: number;        // 10시 이후 1분당 보상 초
  roundingUnitMinutes: number;                  // 반영 단위(1분 또는 10분)
  // + label/description/guideTitle 등 표시용 텍스트 다수
}

interface OvertimeSummary {
  totalRawMinutes: number; before10RawMinutes: number; after10RawMinutes: number;
  remainingThresholdMinutes: number;                          // 임계값까지 남은 분
  eligibleBefore10Minutes: number; eligibleAfter10Minutes: number;  // 보상 산정 대상 분
  rewardSeconds: number;                                      // 총 보상 초
  accruedDays: number; usableDays: number; carryDays: number; carryRewardSeconds: number;
  nextQuarterBefore10Minutes: number; nextQuarterAfter10Minutes: number;  // 다음 0.25일까지 필요
  toOneDayBefore10Minutes: number; toOneDayAfter10Minutes: number;       // 1일까지 필요
}
```

- `DayBucket`(선택 날짜의 기록 묶음), `CalendarDay`(캘린더 셀), `RuleGuideItem`(목표일수→필요시간 테이블 행)은 파생/뷰 전용 타입.
- 두 규칙(`OVERTIME_RULES`, `constants.ts`)은 코드에 하드코딩된 `Record<OvertimeRuleId, OvertimeRule>` — 새 회사 규칙 추가 시 코드 배포가 필요하다.

## 4. 저장 아키텍처

```text
[클라이언트]                                    [서버 (Supabase, server 모드에서만)]
useOvertimeStorage
  ├→ storageMode === "local" (기본값)
  │    └→ localStorage["nightOvertimeRecords"]  (persistLocalRecords, mergeRecordsByDate로 정규화)
  │
  └→ storageMode === "server"
       └→ useOvertimePersistence (훅 내부에 supabase 직접 호출, 별도 레포지토리 파일 없음)
            └→ supabase.from("overtime_rooms" | "overtime_records")
                 - 방 생성: slug(이름 기반) + shortCode(6자리) 조합, 충돌 시 최대 5회 재시도
                 - 방 참조 형식: `${slug}-${shortCode}` (ADR-002 슬러그+쇼트코드 패턴,
                   lib/slug.ts의 createShortCode/toSlug/parseShortCode/isUuid 재사용)
                 - 레코드 저장: replaceRoomRecords로 방 전체를 한 번에 교체(부분 upsert 아님)
```

- **로컬 상태 3키 분리**: `nightOvertimeRecords`(기록), `nightOvertimeStorageMode`(local/server 선택), `nightOvertimeRoomRef`(마지막 연결 방 참조) — 규칙 선택은 별도 키 `nightOvertimeRule`.
- **하이드레이션 대응**: 초기 로드 시 `setTimeout(0)`으로 localStorage 읽기를 지연시켜 SSR과의 mismatch를 피한다. 페이지 재방문 시 `nightOvertimeRoomRef`가 있으면 `fetchRoomData`로 자동 재연결을 시도하고, 실패하면 `local` 모드로 조용히 폴백한다.
- **레코드 병합**: `mergeRecordsByDate`(utils.ts)가 같은 날짜의 여러 레코드를 하나로 합산 — 로컬↔서버 전환, 레거시 포맷(`hours`/`minutes` 필드) 마이그레이션(`parseStoredRecords`) 모두 이 함수를 거친다.
- **스키마 관리 공백**: `overtime_rooms`/`overtime_records` 테이블을 정의하는 SQL 마이그레이션 파일이 저장소에 없다 — 워크아웃(`app/workout/supabase-schema.sql`)이나 계정북(`supabase/*.sql`)과 달리, 테이블 구조는 `hooks/useOvertimePersistence.ts`의 Row 타입 정의(`OvertimeRoomRow`/`OvertimeRecordRow`)로만 추정 가능하다.
- anon key 기반 설계의 트레이드오프는 다른 서비스와 동일하게 수용된 결정([ADR-001](../adr/ADR-001-hybrid-persistence-strategy.md) 참고).

## 5. 도메인 로직 메모

- **`buildOvertimeSummary`**(`utils.ts`): 두 규칙의 계산 로직을 하나의 함수가 공유한다. 레코드를 날짜순 정렬 후 순회하며 `remainingThresholdMinutes`(무보상 임계값)를 먼저 소진시키고, 남은 분만 `roundingUnitMinutes` 단위로 내림 처리해 "보상 산정 대상"으로 인정한다. `threshold_15h`는 임계값 900분을 다 채워야 적립이 시작되고, `from_1830`은 임계값 0이라 즉시 10분 단위로 적립된다 — 규칙 차이가 상수 값 몇 개로만 표현되는 설계.
- **적립 → 사용 가능 일수 변환**: `rewardSeconds`를 `QUARTER_DAY_REWARD_SECONDS`(1일의 1/4)로 나눈 몫이 `usableDays`(0.25일 단위 사용 가능분), 나머지가 `carryDays`(다음 0.25일까지 이월). "다음 0.25일까지/1일까지 몇 시간 더 필요한가"는 `getAdditionalMinutesForRewardSeconds`가 역산한다.
- **`getRuleGuideItems`**: `TARGET_DAY_OPTIONS`(1~10일)마다 "몇 시간 야근해야 그 일수가 나오는가"를 역산해 가이드 테이블을 만든다 — `RuleGuideAccordion`이 더보기로 펼쳐 보여줌.
- **`buildSummaryMessage`**: 계산 결과를 사람이 읽기 좋은 여러 줄 텍스트로 조립(공유·복사용). 보상이 0이면 "적립 시작까지 남은 시간"을, 있으면 "다음 0.25일/1일까지 필요 시간"을 규칙별 분기로 보여준다.
- **낙관적 UI 없음**: `saveQuickRecord`/`persistRecords`는 저장 성공 여부(`boolean`)를 반환하고, 실패 시 폼 리셋을 하지 않는 방식으로 데이터 유실을 막는다(계정북처럼 별도 롤백 로직은 없지만 애초에 낙관적 갱신을 하지 않는 구조).
- **OCR 미사용**: 이 서비스는 영수증/화면 촬영 같은 이미지 입력 경로가 없다. 작업 지시에서 "OCR 활용"이 언급되었으나 실제 코드(`app/overtime/`)에는 `tesseract` 관련 import가 전혀 없음을 확인했다 — workout/account-book과 달리 순수 숫자 입력 도메인이라 이미지 인식이 필요하지 않은 것으로 보인다.

## 6. 알려진 제약 / 후속 과제

- `components/styles.ts`(912줄)가 이 서비스의 거의 모든 styled 컴포넌트를 담은 통짜 파일 — CLAUDE.md의 `.styles.ts` colocation 컨벤션(컴포넌트별 분리)과 다른 패턴. [improvement-backlog.md](../improvement-backlog.md) P3-12(스타일 컨벤션 수렴)의 사례로 참고할 만하다.
- 서버 저장 데이터 계층이 `hooks/useOvertimePersistence.ts` 훅 안에 인라인되어 있어, `repository.ts`/`storage.ts` 등으로 명명을 분리하는 다른 서비스와 컨벤션이 다르다(P2-4 데이터 레이어 통일 대상).
- `overtime_rooms`/`overtime_records` 테이블을 정의하는 SQL 마이그레이션이 저장소에 없어 스키마 변경 이력을 추적할 수 없다 — 다른 서비스 수준으로 `supabase-schema.sql` 또는 `supabase/` 마이그레이션 파일 추가가 필요하다.
- 규칙(`OVERTIME_RULES`)이 코드 상수로 하드코딩되어 있어 회사별 규칙을 사용자가 직접 추가/수정할 수 없다 — 규칙이 늘어나면 관리 화면 또는 DB 기반 규칙 테이블 전환을 고려할 만하다.
- 서버 모드의 `replaceRoomRecords`가 방 전체 레코드를 통째로 교체하는 방식이라, 동시에 같은 방에 접속한 두 사용자가 저장하면 나중 저장이 먼저 저장을 덮어쓸 수 있다(낙관적 잠금·병합 없음).
