# 가계부 서비스 구조 설계

> 2026-07-15 기준. 가계부(account-book) 서비스의 도메인 모델, 화면 구조, 3계층 저장 아키텍처를 정리한다.
> 메뉴 관점 분석은 [menu-details/account-book.md](../menu-details/account-book.md), 전체 개선 항목은 [improvement-backlog.md](../improvement-backlog.md) 참고.

## 1. 서비스 개요

개인 가계부와 공용 가계부방을 하나의 데이터 모델로 다루는 재무 기록 도구.

- **개인 워크스페이스**: 참여 시 자동 생성. 원본 기록을 남기는 기준 공간
- **공용 가계부방(shared)**: 초대 코드로 참여. 참가자별 내역을 한 공간에서 비교
- **공유 링크**: 개인 항목을 골라 공용방으로 미러링 (원본은 개인에 유지)
- 입력은 **문장등록(자연어) 우선** UX로 수렴 중 — 선택입력 폼과 이미지 OCR이 보조

## 2. 화면·컴포넌트 구조

```text
app/account-book/page.tsx              진입점 (PIN 잠금 게이트 → 허브/레저 분기)
├── WorkspaceHub.tsx                   허브: 참여 계정, 개인/공용 워크스페이스 목록
└── WorkspaceLedgerView/               워크스페이스 본 화면 (디렉토리로 분할됨)
    ├── index.tsx                      상태 허브 — 월/뷰모드/선택 상태, 훅 조립
    ├── WorkspaceHeader (../)          sticky 헤더: 뒤로가기+제목 | 월 네비 | 뷰 탭
    ├── EntrySearchBar.tsx             검색 + 카테고리 필터
    ├── NaturalInputSection.tsx        문장등록/이미지등록 모달 (파싱 미리보기)
    ├── WorkspacePanelsSection.tsx     뷰모드별 패널 스위치
    │   ├── TopSummaryControls (../)   수입/지출/현금잔액/자산 요약 카드 스트립
    │   ├── LedgerOverviewSection.tsx  리스트 뷰: 멤버·카테고리·결제수단(실적) 오버뷰
    │   ├── CalendarPanel (../)        캘린더 뷰 (날짜 우클릭 → 문장등록)
    │   ├── DetailEntriesPanel (../)   내역 리스트 (✍️ 문장등록 / ➕ 선택입력 진입)
    │   └── AccountBookDashboardPanel  보드 뷰: 월별 저축 대시보드
    ├── EntryFormModal (../)           선택입력 폼 (수정 겸용)
    └── ShareConfirmDialog.tsx         공용방 공유 확인
```

핵심 훅 (WorkspaceLedgerView/ 내):

| 훅 | 역할 |
|---|---|
| `useEntryForm` | 선택입력 폼 상태 + 항목 페이로드 빌드 |
| `useRegisterModal` | 문장등록/이미지등록 모달 상태, 파서·OCR 연결 |
| `useFixedExpenseTemplates` | 고정비 템플릿 (memo 내 `#fixed-template:` 마커) |
| `useListMemo` | 월별 메모 |
| `useAssetData` (hooks/) | 자산 통장 목록 (저축 세부태그 연동) |

문장 파서는 `WorkspaceLedgerView/utils.ts`의 `parseNaturalInputEntry` — 날짜·금액·결제수단·카드사·카테고리 추론과 키워드 플래그("현금영수증", "실적제외")를 처리한다.

## 3. 데이터 모델

`app/account-book/types.ts`의 `AccountEntry`가 중심:

```ts
type AccountEntry = {
  id: string;
  date: string;                  // YYYY-MM-DD
  member?: string;
  workspaceId: string;
  createdByUserId: string;
  type: "income" | "expense";
  category: string;              // 대표 카테고리 (생활비/고정비/…)
  subCategory?: string;          // 세부 태그 (사용자 지정이 자동추론보다 우선)
  merchant?: string;
  item: string;
  amount: number;
  cardCompany: string;
  payment: "cash" | "card" | "check_card";
  memo: string;
  rawText?: string;              // 문장등록 원문
  cashReceipt?: boolean;         // 현금영수증 발급 (현금 결제에만 의미)
  benefitExcluded?: boolean;     // 카드 실적 집계 제외 (공과금·상품권 등)
};
```

- `ResolvedAccountEntry` = AccountEntry + 공유 해석 결과(source, readonly, 원본 워크스페이스 등)
- 스토어 단위: `users / workspaces / entries / shareLinks / monthlyMemos (+ 자산)`

## 4. 저장 아키텍처 — 3계층 왕복

```text
[클라이언트]                         [서버 (Supabase)]
useEntryForm / 문장파서
  └→ repository.upsertAccountBookEntry
       └→ RPC account_book_upsert_entry ──→ account_book_entries (실제 테이블, 고정 컬럼)
       └→ (네트워크 실패 시) localStorage 폴백
로드:
  RPC account_book_get_store ──→ 테이블들을 jsonb로 조립해 반환
  └→ storage.normalizeStore     ← 화이트리스트 재조립 (필드 검증/기본값)
```

### ⚠️ 필드 추가 체크리스트 (3중 화이트리스트)

항목에 새 필드를 추가하면 **세 곳을 모두** 고쳐야 한다. 하나라도 빠지면 저장/로드 왕복에서 조용히 사라진다 (2026-07-14 `benefitExcluded` 버그의 원인):

1. **클라이언트 정규화** — `app/account-book/storage.ts`의 entry 재조립 2곳 (`normalizeLegacyEntry`, `normalizeStore`)
2. **DB 쓰기** — `account_book_upsert_entry`: `jsonb_to_record` 컬럼 목록 + INSERT/UPDATE 컬럼 (+ 필요 시 `ALTER TABLE account_book_entries`)
3. **DB 읽기** — `account_book_get_store`: entries `jsonb_build_object` 키 목록

DB 함수 수정은 Supabase SQL Editor에서 실행하고, SQL을 `supabase/` 폴더에 마이그레이션 파일로 남긴다 (예: `supabase/20260714_add_entry_receipt_benefit_flags.sql`).

### RPC 목록 (11개, 모두 SECURITY DEFINER)

- 조회: `account_book_get_store`
- 항목: `account_book_upsert_entry`, `account_book_delete_entry`
- 공유: `account_book_toggle_share_link`
- 워크스페이스: `account_book_upsert_workspace`, `account_book_delete_shared_workspace`, `account_book_add_shared_room_member`, `account_book_remove_shared_room_member`
- 사용자/메모: `account_book_upsert_user`, `account_book_delete_user`, `account_book_upsert_monthly_memo`

테이블 직접 접근은 권한으로 차단되어 있고, 모든 읽기/쓰기는 RPC 경유. 권한 검증(작성자 본인, 워크스페이스 멤버)은 함수 내부에서 수행한다. anon key 기반 설계의 트레이드오프는 수용된 결정 ([ADR-001](../adr/ADR-001-hybrid-persistence-strategy.md) 참고).

## 5. 입력 경로 3종

| 경로 | 진입 | 특징 |
|---|---|---|
| 문장등록 | 캘린더 날짜 우클릭 / 내역 패널 ✍️ 버튼(모바일 대응) | `parseNaturalInputEntry`가 날짜·금액·결제수단·카드사·플래그 추론, 저장 전 미리보기 |
| 선택입력 폼 | 내역 패널 ➕ 버튼 | `EntryFormModal` — 결제수단 조건부 토글(현금→🧾, 카드→🚫) 포함 |
| 이미지 OCR | 문장등록 모달의 이미지 탭 | tesseract.js dynamic import, 중복 키 검사 후 일괄 저장 |

### 파서 키워드 규약

- "현금영수증 (발급)" / "영수증 (발급)" → `cashReceipt: true` + 결제수단 현금 추론 (단, "카드" 명시 문장에선 무시)
- "실적제외" / "실적 제외" → `benefitExcluded: true` (카드/체크카드로 파싱된 경우에만)
- 키워드는 항목명(item)에서 제거되어 잔여 단어가 남지 않는다

## 6. 도메인 로직 메모

- **카드 실적**: `CARD_BENEFIT_THRESHOLDS`(utils.ts, 카드사별 기준액 하드코딩) × 월 사용액으로 `getCardBenefitStatus` 계산. 사용액은 `amount 합계 - benefitExcluded 합계`(실적 인정액) 기준이며, 표시 총액과 분리되어 있다. 제외분은 "· 제외 X원"으로 노출
- **현금영수증**: 기록·표시용 플래그 (🧾 배지). 연말정산 소득공제 합계 대시보드는 백로그
- **세부 태그**: 사용자가 지정한 `subCategory`가 자동추론보다 항상 우선 (그룹핑에서 덮어쓰기 금지)
- **고정비 템플릿**: memo의 `#fixed-template:<id>` 마커로 연결, 표시 시 `normalizeDisplayText`가 제거

## 7. 알려진 제약 / 후속 과제

- `account-book`은 500줄+ 대형 파일이 가장 밀집된 서비스 (`WorkspaceLedgerView/utils.ts` 1,395줄 등) — 분해는 개선 백로그 P2-6
- PWA: `/account-book/manifest.webmanifest`는 라우트 핸들러로 서빙 (Next manifest.ts 컨벤션이 앱 루트 전용이라서). 아이콘은 favicon.ico뿐 — 192/512 PNG 추가 여지
- 반응형 분기: 요약 카드 스트립·헤더는 720~767px에서 모바일 모드 전환 (태블릿은 PC 레이아웃)
