# 일일 기록 서비스 구조 설계

> 2026-07-15 기준. 일일 기록(daily) 서비스의 도메인 모델, 화면 구조, 암호화 저장 아키텍처를 정리한다.
> 메뉴 관점 분석은 [menu-details/daily.md](../menu-details/daily.md) — ⚠️ 아래 6항 참고, 전체 개선 항목은 [improvement-backlog.md](../improvement-backlog.md) 참고.

## 1. 서비스 개요

"한 줄 일기 + 체크리스트"를 월 단위 기록장으로 관리하는 개인용 라이프로그. 접근 비밀번호(access code)로 기록장을 잠그고, 그 비밀번호가 곧 서버 측 암호화 키로도 쓰인다.

- **기록장 생성**: 제목 + 접근 비밀번호(4자 이상) + 초기 체크리스트로 생성 (`/daily` → `/daily/[id]`)
- **월별 체크리스트**: 월마다 다른 체크리스트를 구성 가능 (지난달과 이번달 항목이 달라도 됨)
- **날짜별 기록**: 하루 단위로 일기(diary) + 체크 배열(checks)을 저장
- 2026-02-12 마이그레이션(`supabase/20260212_create_secure_daily_tables.sql`)으로 **localStorage → Supabase 암호화 테이블**로 전환됨 (2항 참고)

## 2. 화면·컴포넌트 구조

```text
app/daily/page.tsx                     생성/열기 진입점 (제목+접근코드+체크리스트, 기존 기록장 열기)
└── app/daily/[id]/page.tsx            상태 허브 — 잠금/로딩/에러/본문 분기
    ├── useDailyNotebook.ts            핵심 훅 — notebook/entries/checklist 로드 + CRUD
    ├── components/LockScreen.tsx      접근 비밀번호 입력 잠금 화면
    ├── components/NotebookHeader.tsx  제목·월평균 점수·설정(⚙️) 진입
    ├── components/MonthNavBar.tsx     월 이동 (이전/다음/이번달로)
    ├── components/NotebookBoardSection.tsx  날짜별 일기+체크 보드, trend graph(SVG)
    └── components/SettingsModal.tsx   체크리스트 편집 + 접근 비밀번호 변경
```

지원 모듈:

| 파일 | 역할 |
|---|---|
| `useDailyNotebook.ts` | 접근코드 상태, notebook/월별 checklist/월별 entries 로드, 저장(diary/check/checklist/access code 변경) |
| `repository.ts` | Supabase RPC 호출 래퍼 (`daily_*` 함수 6종) + row → 클라이언트 타입 정규화 |
| `storage.ts` | `DailyNotebookConfig`/`DailyNotebookEntry` 타입, 날짜·월키 유틸, 월별 엔트리 조립(`buildMonthEntries`), sessionStorage 접근코드 캐시, 레거시 localStorage 정리(`clearLegacyDailyLocalData`) |
| `[id]/helpers.ts` | trend graph 상수, `getScore`(체크 완료율), 에러 메시지 추출 |

## 3. 데이터 모델

`app/daily/storage.ts`:

```ts
export interface DailyNotebookConfig {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyNotebookEntry {
  date: string;      // YYYY-MM-DD
  diary: string;
  checks: boolean[]; // 해당 월 체크리스트 길이에 맞춰 정규화됨
}
```

### 테이블 (`supabase/20260212_create_secure_daily_tables.sql`)

- `daily_notebooks` — `title_encrypted`(bytea), `access_code_hash`(bf 해시)
- `daily_monthly_checklists` — `(notebook_id, month_key)` PK, `checklist_encrypted`(bytea, jsonb 직렬화)
- `daily_entries` — `(notebook_id, entry_date)` PK, `diary_encrypted` + `checks_encrypted`(bytea)

세 테이블 모두 `anon`/`authenticated`에서 `revoke all` — 오직 `SECURITY DEFINER` RPC 함수로만 접근 가능하다.

## 4. 저장 아키텍처 — 접근코드 = 암호화 키

```text
[클라이언트]                                    [서버 (Supabase, SECURITY DEFINER)]
useDailyNotebook
  ├→ repository.createDailyNotebook  ──→ daily_create_notebook
  ├→ repository.fetchDailyNotebook   ──→ daily_get_notebook          (daily_assert_access로 코드 검증 후 복호화)
  ├→ repository.fetchDailyMonthlyChecklist / saveDailyMonthlyChecklist
  ├→ repository.fetchDailyMonthEntries / saveDailyEntry
  └→ repository.changeDailyAccessCode ──→ daily_change_access_code   (모든 encrypted 컬럼을 새 코드로 재암호화)
```

- `daily_assert_access(notebook_id, access_code)`: `crypt()`로 저장된 `access_code_hash`와 대조, 불일치 시 예외 → 모든 RPC가 먼저 이 함수를 `perform`한다
- 모든 콘텐츠 컬럼은 `pgp_sym_encrypt(값, access_code, 'cipher-algo=aes256')`로 저장되고, 조회 시 `pgp_sym_decrypt`로 복호화된다. **즉 접근 비밀번호 자체가 대칭키다** — 비밀번호를 잃으면 서버도 복호화할 수 없다
- 클라이언트는 접근 비밀번호를 `sessionStorage`(`daily-access-code:<id>`)에만 캐시한다 (브라우저 세션 종료 시 소멸, `localStorage`엔 저장하지 않음)
- `useDailyNotebook`의 로드 실패 시 `clearStoredDailyAccessCode` 후 `LockScreen`으로 되돌아간다
- `clearLegacyDailyLocalData()`(페이지 진입/훅 마운트 시 항상 실행)는 구버전 localStorage 키(`daily-notebooks`, `daily-notebook-entries:*`, `daily-unlocked:*`)를 정리하는 마이그레이션 잔재 코드

## 5. 도메인 로직 메모

- **월간 draft 분리**: `draftChecklistByMonth`(월키별 임시 편집 상태)가 실제 저장된 `monthChecklist`와 분리되어 있어, "저장" 버튼을 누르기 전까지는 서버에 반영되지 않는다 (`hasChecklistChanges`로 변경 여부 비교)
- **월 엔트리 조립**: `buildMonthEntries(monthKey, rawEntries, checkCount)`가 해당 월의 모든 날짜에 대해 엔트리를 생성(기록 없는 날짜는 빈 값)하고, 체크 배열 길이를 현재 체크리스트 길이로 맞춘다(`normalizeEntries`)
- **평균 점수/트렌드**: `getScore(checks)` = 완료 개수/전체 × 100. `[id]/page.tsx`가 엔트리 배열로 `avgScore`와 SVG trend graph 좌표(`TREND_COLUMN_WIDTH`/`TREND_ROW_HEIGHT` 기준)를 계산한다
- **체크 토글의 낙관적 업데이트**: `toggleCheck`는 즉시 로컬 state를 반영한 뒤 `persistEntry`로 저장하고, 실패 시 이전 상태로 롤백한다
- **비밀번호 변경**: `daily_change_access_code`가 notebook 제목 + 모든 월 체크리스트 + 모든 날짜 엔트리를 한 트랜잭션 안에서 재암호화한다 — 엔트리가 많을수록 이 RPC 비용이 커진다

## 6. 알려진 제약 / 후속 과제

- **⚠️ [menu-details/daily.md](../menu-details/daily.md)는 localStorage 시절 문서다.** "localStorage 기반", "클라우드 백업이 전혀 없다"는 서술은 2026-02-12 Supabase 암호화 마이그레이션 이전 상태를 설명하며 현재 코드와 맞지 않는다. 갱신 필요
- daily의 저장 전략은 [ADR-001](../adr/ADR-001-hybrid-persistence-strategy.md)이 "개인용 = localStorage"로 분류했던 원래 결정에서 벗어나 있다 — ADR 갱신 또는 후속 결정 기록 필요
- 접근 비밀번호가 곧 암호화 키라서 **비밀번호 분실 시 복구 수단이 전혀 없다** (설계상 트레이드오프, 사용자에게 명시적으로 고지되지 않음)
- 동일 기록장을 여러 기기에서 동시 편집할 때 충돌 처리가 없다 — 단순 upsert로 마지막 쓰기가 우선
- export/import, 백업 기능 없음
