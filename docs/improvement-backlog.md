# 황총무 개선 백로그

> 2026-07-13 코드베이스 전수 감사 결과. 구조·품질·보안·성능/UX 4개 축으로 분석했으며, 모든 수치는 grep/find/tsc/eslint 실측 기준.
> 전제: Supabase anon key + RLS 트레이드오프는 수용된 설계로 간주하고 제외함.

## 반영 현황 (2026-07-13 반영 완료)

| 항목 | 상태 |
|---|---|
| P1-1 스케줄 API 접근제어 2건 | ✅ 반영 — store에 세션 대조+inviteCode 게이트, workspace POST에 세션/비밀번호 신원 증명 |
| P1-2 무성 실패 (useMonthlyTracker·useScheduleActions·무시 catch 4곳) | ✅ 반영 — error 검사+loading 플래그, 낙관적 업데이트 롤백+openAlert, catch 교체 |
| P1-3 npm audit | ✅ 반영 — next 16.2.10·ws 8.21.0 (HIGH 0). 잔여 moderate 2건은 next 번들 내부 postcss로, fix 경로가 next@9 다운그레이드뿐이라 수용 |
| P2-4 데이터 레이어 ESLint 가드 | ✅ 반영 — no-restricted-imports(warn), 컴포넌트에서 lib/supabase import 시 경고. 기존 위반 정리는 후속 |
| P2-7 services/schedule.ts any 제거 | ✅ 반영 — Row/Update 타입 신설, any 24건→0 |
| P2-8 rate limit·에러 노출 | ✅ 반영 — lib/rate-limit.ts 신설, login/enter/naver-search 429, register 고정 메시지 |
| P2-9 유틸 중복 통합 | ✅ 반영 — utils/date.ts 신설, formatAmount import 통일 |
| P2-5 room 훅 5벌 통합 | ⏸ 보류 — 테스트 부재로 4개 서비스 실시간 훅의 자동 회귀검증 불가. 수동 QA 가능한 별도 세션 권장 |
| P2-6 대형 파일 분해 | ⏸ 보류 — 동일 사유. 파일당 개별 세션으로 점진 진행 권장 |
| P3 전체 | 미착수 (이번 범위 외) |

## 현재 상태 요약

| 지표 | 실측값 |
|---|---|
| `npx tsc --noEmit` | 에러 0 ✅ |
| `npm run lint` | 139건 (에러 69 / 경고 70) |
| 린트 분포 | no-unused-vars 63 · no-explicit-any 53 · exhaustive-deps 7 |
| `any` 사용 | 55건 (services/schedule.ts에 22건 집중) |
| 500줄 이상 파일 | 30개+ (최대 2,092줄) |
| `lib/supabase` 직접 import | 22~23파일* (services/ 경유는 실질 schedule 1개 서비스뿐) |
| `"use client"` | app/ 285파일 중 165개 (57.9%) · page.tsx 40개 중 36개 (90%) |
| `loading.tsx` / `error.tsx` | 0개 |
| 스타일 체계 | styled-components 142~164파일* vs Tailwind 약 63파일*, 혼용 9파일 |

\* 측정 기준에 따라 ±수 파일 오차: supabase는 검색 스코프(components 포함 여부), styled-components는 import문 기준 vs styled 사용 기준, Tailwind는 유틸 클래스 패턴 근사 매칭. 방향성과 우선순위 판단에는 영향 없음.

---

## P1 — 즉시 조치 (실제 동작/보안에 영향)

### 1. 스케줄 API 접근제어 취약점 2건 (보안 HIGH)
- `app/api/schedule/store/route.ts:9-72` — 세션 검증 없이 `?userId=`만으로 타인의 전체 워크스페이스 목록과 **inviteCode(참여용 비밀 토큰)** 조회 가능. 같은 워크스페이스 멤버라면 `/members` 응답에서 타인 userId를 정상 취득할 수 있어 실제 악용 경로가 성립함 (IDOR).
- `app/api/schedule/workspace/route.ts:19-76` — 요청 바디의 `ownerUserId`를 신원 증명 없이 신뢰, 타인 명의 워크스페이스 생성 가능.
- **조치**: 두 라우트에 다른 schedule 라우트와 동일한 세션 검증(`requireScheduleSession`) 적용. 프리-세션 흐름이 필요하면 최소한 `inviteCode`를 store 응답에서 제거.
- 나머지 schedule 라우트는 scrypt+timingSafeEqual, HMAC 세션 등 견고하게 구현되어 있어 이 2건만 예외임.

### 2. 에러를 조용히 삼키는 데이터 경로 (품질 HIGH)
- `app/habit/useMonthlyTracker.ts` — supabase 호출 5곳이 `error`를 구조분해조차 안 함(L46, L60, L71, L98, L108). 실패 시 빈 화면으로 무성 실패. mutation 4곳(L133~158)도 결과 미확인. 로딩 플래그도 없어 초기 렌더가 빈 상태로 팝인함.
- `hooks/useScheduleActions.ts` — 낙관적 업데이트 후 실패 시 롤백 없음(L64-81, L94-165). 서버 저장은 실패했는데 화면엔 성공으로 보이는 상태 불일치. 같은 파일 안에서도 `handleAddPhase`만 openAlert를 쓰는 등 정책 비일관.
- `.catch(() => {})` 완전 무시 4곳 — `app/schedule/page.tsx:82`, `part-calendar/page.tsx:53`, `[id]/page.tsx:57, 258`.
- 전역 통계: catch 128곳 중 58곳(45%)이 console만 찍고 사용자 알림 없음.
- **조치**: 위 2개 훅부터 error 검사 + openAlert 연결. 낙관적 업데이트는 실패 시 이전 상태 복원.

### 3. 의존성 보안 업데이트
- `npm audit`: next(Server Actions 노출·DoS·미들웨어 우회 등 다수 GHSA), ws — HIGH. postcss·yaml — moderate.
- **조치**: `npm audit fix` 후 빌드 확인. 배포 중인 앱이므로 방치 시 리스크 누적.

---

## P2 — 구조 개선 (레버리지 큰 리팩토링)

### 4. 데이터 레이어 컨벤션 통일 + 재발 방지 가드
- 현재 3중 혼재: `services/*.ts`(schedule·dinner) / `app/<svc>/repository.ts` / `app/<svc>/storage.ts`. inbody·daily·account-book·workout은 repository와 storage를 **둘 다** 보유.
- UI 컴포넌트가 supabase를 직접 호출: `app/game/components/ClickerGame.tsx`, `app/habit/CommentSection.tsx` 등 19파일(repository 제외).
- **조치**: 명명 하나로 통일(참조 모델: `services/schedule.ts` 패턴). ESLint `no-restricted-imports`로 `app/**/components`에서 `lib/supabase` import 금지 — 저비용으로 재발 차단.

### 5. room/투표 훅 5벌 통합 (~1,222줄 → 제네릭 1개)
- `hooks/useRoom.ts`(410줄) · `useGameRoom.ts`(270줄) · `usePlaceVote.ts`(240줄) · `useRoomActions.ts`(157줄) · `useCreateRoom.ts`(145줄) — 전부 "방 생성 → 참가자 → 투표/제출" 동일 라이프사이클을 테이블명만 바꿔 반복.
- 부속 중복: RoomHeader 3벌(`app/game/[id]/` vs `app/meeting/room/detail/` 등), ParticipantList 2벌, 공유 버튼 3벌.
- **조치**: 테이블명·매퍼를 config로 주입받는 `useRealtimeRoom(config)` 훅 + 공통 `RoomHeader`/`ParticipantList` 컴포넌트. 1,000줄 이상 절감, 버그 수정 지점 단일화. 단 초기 설계 비용이 커서 P1 이후 착수 권장.

### 6. 대형 파일 분해 (테스트 부재를 감안해 저위험 순서로)
- 1,000줄+ : `app/workout/weight/page.tsx`(2,092) · `workout/components/WorkoutCharts.tsx`(1,936) · `account-book/.../WorkspaceLedgerView/utils.ts`(1,395) · `account-book/annual/page.tsx`(1,380) · `WorkspaceLedgerView/index.tsx`(1,226) · `AssetBoardSection.tsx`(1,214) · `workout/run/page.tsx`(1,167) · `WorkspaceHub.tsx`(1,160)
- account-book의 `WorkspaceLedgerView/` 한 폴더에만 약 4,900줄 집중 — 최우선 분해 대상.
- **조치**: 페이지 로직/차트 설정/스타일을 훅·모듈로 분리. `utils.ts`(1,395줄)는 계산·포맷·집계 도메인 단위로 분할.

### 7. services/schedule.ts 타입 복구
- `any` 22건(파일 전체의 40%)이 스케줄/칸반의 핵심 데이터 계층에 집중 — `mapTaskFromDB(task: any)`, `updateService(updates: any)` 등. 다운스트림(`useScheduleActions.ts:64`)까지 any 전파.
- **조치**: DB row 타입을 `types/work-schedule.ts` 기준으로 명시, `updates`는 `Partial<T>`로. 린트 에러 69건 중 대부분이 여기서 해소됨.

### 8. 인증/프록시 엔드포인트 남용 방지 (보안 MEDIUM)
- `login`/`enter` 라우트에 실패 횟수 제한·rate limit 없음 → 브루트포스 무방비.
- `app/api/naver-search/route.ts` — 인증·rate limit 없이 유료 외부 API 프록시 개방, query 길이 제한 없음.
- `app/api/schedule/auth/register/route.ts:86-90` — DB 에러 메시지(스키마 정보)를 클라이언트에 그대로 반환.
- **조치**: IP 기준 간단한 rate limit, query 길이 상한, register 에러는 서버 로그만 남기고 고정 메시지 반환.

### 9. 중복 유틸 통합
- `YYYY-MM-DD` 수작업 포맷이 4파일에 동일 구현(`overtime/utils.ts:88` · `daily/storage.ts:28` · `inbody/storage.ts:39` · `workout/helpers.ts:101,108` — 한 파일 안에서도 2벌). date-fns가 이미 의존성인데 미사용.
- `formatAmount`(`${v.toLocaleString()}원`)가 account-book 4곳에 동일 정의 — `WorkspaceLedgerView/utils.ts`에 이미 export가 있는데 나머지 3곳이 import 안 함.
- localStorage 접근 15파일, ID 생성(`Math.random` vs `crypto.randomUUID`) 10파일 산재.
- **조치**: 공용 `utils/`(현재 2파일뿐)에 date·format·storage 헬퍼 확립 후 교체.

---

## P3 — 품질/일관성 (저위험, 틈틈이)

### 10. 라우트 로딩/에러 바운더리 도입
- `loading.tsx`/`error.tsx` 0개. 동적 라우트(`schedule`·`habit`·`diet`·`place` 등 `[id]`) 최초 진입 시 순간 빈 화면, 커스텀 로딩 문구는 서비스마다 제각각(🥕/🥗 등).
- **조치**: 주요 라우트부터 `loading.tsx` 추가, 최상위 `error.tsx` 1개라도 도입.

### 11. 린트 정리
- no-unused-vars 63건(최다: `ScheduleHub.tsx` 등), `console.log` 3건(`hooks/useCalcPersistence.ts:63,83` — 자동저장 경로에서 룸 ID 노출, `KakaoCalendarShare.tsx:30`), exhaustive-deps 7건.
- **조치**: 기계적 정리 가능. `--fix` + 수동 확인 한 차례.

### 12. 스타일 컨벤션 수렴
- styled-components(164파일)와 Tailwind(63파일) 혼용 9파일 — 대표: `app/diet/[id]/page.tsx:30`(로딩만 Tailwind, 나머지 styled). CLAUDE.md의 `.styles.ts` colocation 컨벤션 실준수는 6파일뿐이고, `overtime/components/styles.ts`(912줄) 같은 통짜 스타일 파일 존재.
- **조치**: 신규 코드 기준을 정하고(예: styled-components 우선, Tailwind는 일회성 유틸만), 혼용 9파일부터 정리.

### 13. 잔여 소소한 정리
- 가계부 PIN `"6155"`이 `AccountBookLockGate.tsx:99`와 `storage.ts:15` 두 곳에 중복 하드코딩(수용된 토이 관례지만 상수 단일화는 필요).
- `.env.local`의 `NEXT_PUBLIC_ADMIN_PASSWORD` — 코드 어디서도 미참조인 죽은 변수. 삭제 권장.
- `app/meeting/room/detail/` + `room/[id]/components/` 이중 폴더 컨벤션 → 한 방식으로 병합.
- MUI 의존성: `@mui/material`·`@emotion/*`은 컴포넌트로는 0건 사용이지만 `@mui/icons-material`의 peer dependency라 **단순 제거 불가**. 의존성 3개를 덜어내려면 아이콘 라이브러리 교체(lucide-react 등)가 전제 — 선택 사항.

---

## 잘 되어 있는 부분 (유지할 것)

- tesseract.js 2곳 모두 dynamic import — 초기 번들 오염 없음
- MUI icons-only 원칙 실준수(컴포넌트 사용 0건), framer-motion named import 최소 사용
- `<img>` 0건, scrypt+HMAC 인증 구현 견고, service role key 서버 격리 확인
- `components/common/ModalProvider.tsx` 큐 기반 모달 — 견고한 참조 구현
- tsc 에러 0 유지

## 권장 착수 순서

1. **P1-1 → P1-2 → P1-3** (보안 2건 수정, 무성 실패 훅 2개 수정, audit fix) — 각각 반나절 이내
2. **P2-4** ESLint 가드 + 컨벤션 문서화 — 저비용 재발 방지를 리팩토링보다 먼저
3. **P2-7 → P2-9 → P2-6** 타입/유틸/대형 파일 — 저위험 순
4. **P2-5** room 훅 통합 — 효과 최대지만 비용도 최대, 마지막에
