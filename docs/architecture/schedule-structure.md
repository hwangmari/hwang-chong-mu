# 업무 캘린더(schedule) 서비스 구조 설계

> 2026-07-15 기준. 업무 캘린더(schedule) 서비스의 도메인 모델, 화면 구조, 서버 세션 인증 기반 저장 아키텍처를 정리한다.
> 메뉴 관점 분석은 [menu-details/schedule.md](../menu-details/schedule.md), 전체 개선 항목은 [improvement-backlog.md](../improvement-backlog.md) 참고.
>
> ⚠️ `menu-details/schedule.md`는 과거 버전(미들웨어 쿠키 인증, `/login` 페이지, `schedule_boards` 테이블) 기준으로 작성되어 있다. 현재 구현은 `middleware.ts` 자체가 없고, 인증은 `ScheduleSessionGate` + 서버 세션 쿠키(`hws-session`) 방식으로 전면 교체되었다. 이 문서가 최신 구조를 반영한다.

## 1. 서비스 개요

파트(워크스페이스) 단위로 서비스(프로젝트 보드)를 만들고, 그 안에서 단계(phase)·업무(task)·이슈를 관리하는 업무용 캘린더/칸반 도구. 37개 파일로 프로젝트 내 가장 큰 서비스이며, **유일하게 서버 세션 인증을 갖춘 서비스**다.

- **개인 파트(personal)**: 계정 생성 시 자동 발급되는 1인 캘린더
- **공용 파트(shared)**: 초대코드로 멤버를 모으는 팀 캘린더. 멤버별 역할(owner/member) 구분
- **서비스(보드)**: 파트 하위의 프로젝트 단위. 서비스 안에 단계(phase)와 업무(task)가 쌓인다
- 뷰는 3종: 캘린더(단계·업무를 월간 그리드에 배치), 칸반(진행 상태별 컬럼), 파트 전체 통합 캘린더
- 이슈 트래킹(블로커/주의/정상)과 멤버별 업무량(workload) 집계를 부가 기능으로 제공

## 2. 화면·컴포넌트 구조

```text
app/schedule/page.tsx                  진입점 — Suspense, useScheduleStore+useSchedulePartActions 조립
├── components/ScheduleHub.tsx         파트 미선택 시: 로그인/계정생성, 개인·공용 파트 목록, 파트 생성/참여 모달
├── components/ScheduleSessionGate.tsx 파트 선택 시: 서버 세션 유효성 확인 → 비밀번호 재입력 게이트
└── components/ScheduleWorkspaceView.tsx  파트 내 서비스(보드) 목록 · 생성/수정/삭제, ServiceCard 그리드

app/schedule/[id]/page.tsx             서비스 상세 — 좌(캘린더)/우(업무 패널+이슈 패널) 분할
├── components/ScheduleHeader.tsx      제목, 주말표시 토글, 칸반 링크, 멤버 필터(공용 파트만)
├── components/LeftCalendar.tsx        월간 그리드 — Calendar/{MonthGrid,CalendarDayCell,CalendarHeader,CalendarTaskItem}
├── components/RightTaskPanel.tsx      단계·업무 목록 — useScheduleActions로 CRUD, Task/TaskList 이하로 렌더
│   └── components/Task/               TaskList, TaskCardItem, TaskCardHeader, DateInput, ColorPicker, MemoArea, EyeIcon
├── components/QuickTaskModal.tsx      캘린더 날짜 클릭/우클릭 → 빠른 업무 등록
└── components/IssuePanel.tsx          서비스 단위 이슈 CRUD (심각도 blocker/warning/normal, 상태 open/in_progress/resolved)

app/schedule/[id]/kanban/page.tsx      같은 서비스 데이터를 진행 상태 관점으로 재구성 (To-Do/In Progress/Done)
└── components/Kanban/                 KanbanColumn, KanbanCard, card/{ColorPicker,QuickAddForm,TaskItem}

app/schedule/part-calendar/page.tsx    파트 소속 전 서비스의 단계를 합산한 통합 캘린더 (LeftCalendar 재사용)
app/schedule/members/page.tsx          파트 멤버별 업무량(workload) 집계 페이지
app/schedule/create/page.tsx           ⚠️ 죽은 경로 — 아래 6절 참고
app/schedule/opengraph-image.tsx       OG 이미지
```

핵심 훅:

| 훅 | 위치 | 역할 |
|---|---|---|
| `useScheduleStore` | hooks/ | 활성 유저·소속 파트(개인/공용) 목록·선택된 파트·서비스 목록 상태 소유, localStorage에 `activeUserId` 영속 |
| `useSchedulePartActions` | hooks/ | 계정 생성/로그인, 공용 파트 생성/참여, 워크스페이스 입장(세션 발급), 로그아웃, 서비스 생성 액션 묶음 |
| `useScheduleActions` | hooks/ | 서비스 상세의 단계·업무 CRUD — **낙관적 업데이트 + 실패 시 롤백** 패턴(2026-07-13 P1-2 반영) |
| `useCardScroll` | hooks/ | RightTaskPanel 카드 스크롤 보조 |

## 3. 데이터 모델

`types/work-schedule.ts`가 도메인 타입의 기준. 서버 응답은 camelCase/snake_case가 혼재해 `services/schedule.ts`의 `*Row` 타입과 매퍼가 흡수한다.

```ts
type ScheduleUser = {
  id: string;
  name: string;
  password: string;          // 클라이언트 표시용, 항상 빈 문자열로 채워짐(실값은 서버 해시로만 존재)
  personalPartId: string;
};

type SchedulePart = {
  id: string;
  name: string;
  type: "personal" | "shared";
  password: string;
  ownerUserId?: string;
  memberIds: string[];
  inviteCode?: string;
};

type SchedulePhase = {               // "단계" — 서비스 하위, 업무를 담는 컨테이너
  id: string;
  phaseName: string;
  color: string;
  tasks: TaskPhase[];
  isCompleted: boolean;
  isHidden: boolean;
  memberId?: string;                 // 공용 파트에서 개인별 단계를 구분(멤버 필터에 사용)
  memberName?: string;
  memberColor?: string;
};

type TaskPhase = {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  memo: string;
  isCompleted: boolean;
};

type ScheduleIssue = {
  id: string;
  serviceId: string;
  title: string;
  description: string;
  severity: "blocker" | "warning" | "normal";
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  resolvedAt: string | null;
};
```

계층 구조: `Part(워크스페이스) → Service(보드) → Phase(단계) → Task(업무)`, 그리고 `Service → Issue`.

## 4. 저장 아키텍처 — REST API + 서버 세션 (RPC 아님)

account-book과 달리 **Supabase RPC를 쓰지 않는다**. 클라이언트는 `services/schedule.ts`를 통해 `app/api/schedule/*` REST 라우트만 호출하고, 라우트 내부에서 `lib/schedule-admin.ts`의 **service role 키** 클라이언트로 테이블에 직접 접근한다(RLS 우회, 서버 전용).

```text
[클라이언트]                              [Next.js 서버 라우트]                    [Supabase]
services/schedule.ts (api<T> 래퍼)
  └→ fetch("/api/schedule/**", { credentials: "same-origin" })
                                        app/api/schedule/**/route.ts
                                          ├→ requireScheduleSession()   ── hws-session 쿠키(HMAC 서명) 검증
                                          ├→ assertWorkspaceMatch / assertOwner / assertServiceMutation
                                          └→ getScheduleAdminClient()   ── service_role 키로 테이블 CRUD
                                                                              schedule_users / schedule_workspaces /
                                                                              schedule_workspace_members / schedule_services /
                                                                              schedule_phases / schedule_tasks / schedule_issues
```

### 세션 인증 흐름

1. **비밀번호 해시**: `lib/schedule-password.ts` — Node `crypto.scrypt`(N=2^14, r=8, p=1) + `timingSafeEqual`. 포맷 `scrypt$N$r$p$saltHex$hashHex`
2. **레거시 평문 업그레이드**: `lib/schedule-auth-helpers.ts`의 `verifyUserPassword`/`verifyWorkspacePassword` — `password_hash`가 없고 평문 `password` 컬럼이 일치하면 그 자리에서 해시로 승격
3. **세션 토큰**: `lib/schedule-session.ts` — 외부 JWT 라이브러리 없이 HS256을 직접 구현(`SCHEDULE_SESSION_SECRET` 32자 이상 필수). 페이로드 `{workspaceId, userId, role, iat, exp}`, TTL 24시간. 쿠키명 `hws-session`, httpOnly+sameSite=lax
4. **라우트 가드**: `lib/schedule-route-guard.ts` — `requireScheduleSession()`(401), `assertWorkspaceMatch()`(403, 세션 워크스페이스 불일치), `assertOwner()`(403, owner 전용), `assertServiceMutation()`(403, 워크스페이스 불일치 또는 본인 소유 서비스가 아닌 member)
5. **rate limit**: `lib/rate-limit.ts` — 인메모리 버킷(서버리스 다중 인스턴스에선 완벽하지 않음, 남용 억제용). `auth/enter`에 `10회/60초` 적용

`ScheduleSessionGate`(컴포넌트)는 파트 진입 시 `/api/schedule/auth/me`로 세션을 먼저 확인하고, 없으면 비밀번호 입력 폼으로 `onEnter → enterWorkspaceApi → /api/schedule/auth/enter`를 호출해 쿠키를 발급받는다.

### API 라우트 목록 (18개)

| 그룹 | 라우트 |
|---|---|
| 인증 | `auth/register`, `auth/login`, `auth/enter`, `auth/join`, `auth/leave`, `auth/me` |
| 파트/워크스페이스 | `store`(유저+소속 파트), `workspace`(생성), `workspace/[id]`, `workspace/[id]/members`, `workspace/[id]/members/[userId]`, `workspace/[id]/services` |
| 서비스/단계/업무 | `service/[id]`, `service/[id]/phases`, `service/[id]/issues`, `phase/[id]`, `phase/[id]/tasks`, `task/[id]` |
| 이슈 | `issue/[id]` |

### localStorage 사용 범위

서버 세션과 별개로 클라이언트에 `hwang-schedule-active-user`(활성 유저 ID) 하나만 저장한다(`services/schedule.ts`, `hooks/useScheduleStore.ts`). 도메인 데이터(파트/서비스/업무)는 전부 서버 왕복이며 localStorage 캐시가 없다 — account-book의 3계층 폴백 구조와 달리 여기는 API 실패 시 폴백 저장소가 없다.

## 5. 주요 도메인 로직 메모

- **낙관적 업데이트 + 롤백**: `useScheduleActions`의 `handleUpdatePhase`/`handlePhaseNameBlur`/`updateTask`/`deleteTask`는 먼저 로컬 상태를 갱신하고, API 실패 시 `prevPhases`로 되돌린 뒤 `openAlert`. 단 `handleAddPhase`/`handleAddTask`는 서버 응답을 받은 뒤에만 로컬에 반영(생성은 롤백 대상이 없어 순서가 다름)
- **공용 파트 캘린더 합성**: `[id]/page.tsx`의 `allPhases`는 서비스 자체 단계(`phases`) + 같은 파트의 다른 멤버 개인 단계(`sharedPhases`, `fetchSharedCalendarPhases`)를 합쳐서 보여준다. `memberFilters`로 멤버별 표시/숨김 토글
- **칸반 분류 기준**: `isCompleted`와 `tasks.length`만으로 3분류(`To-Do`=미완료+업무없음, `In Progress`=미완료+업무있음, `Done`=완료). 별도 상태 필드 없이 파생 계산
- **날짜 미리보기**: 캘린더 날짜 클릭 시 `previewDate` state로 해당 날짜에 걸친 미완료 업무를 하단 팝오버에 나열(`isWithinInterval` 기반)
- **워크로드 집계**: `fetchMemberWorkloads`(services/schedule.ts)는 파트의 전 서비스를 순회하며 멤버별 단계를 그룹핑, `totalTasks/activeTasks/completedTasks`를 합산 — N+1 패턴(서비스 수만큼 개별 fetch, 실패한 서비스는 조용히 skip)
- **초대코드**: `crypto.randomBytes(8).toString("base64url").toUpperCase()`로 생성, 워크스페이스 생성 시 발급. `invite_code_expires_at`/`invite_code_single_use` 컬럼이 스키마에 있으나 발급/조회 코드에서 실제로 사용하는 흐름은 확인되지 않음(일회용·만료 로직 미구현 가능성)

## 6. 알려진 제약 / 후속 과제

- **`app/schedule/create/page.tsx`는 죽은 경로다**: `services/schedule.ts`의 `createService()`는 항상 `throw new Error("서비스는 워크스페이스 안에서만 생성할 수 있습니다...")`를 던지도록 레거시 스텁으로 바뀌어 있다. 실제 서비스 생성은 `ScheduleWorkspaceView`의 인라인 폼(`onCreateService` → `createServiceInPart`)이 담당하며, `/schedule/create`로 진입하면 항상 "생성 실패!" 알림만 뜬다. 라우트 삭제 또는 워크스페이스 선택 페이지로 리다이렉트 처리가 필요
- **RPC 미사용, service role 직접 접근**: account-book(SECURITY DEFINER RPC 11개)과 달리 이 서비스는 서버 라우트가 `service_role` 키로 테이블에 직접 CRUD한다. 권한 검증은 각 라우트의 `requireScheduleSession`/`assert*` 호출에 전적으로 의존 — 라우트 하나라도 가드를 빠뜨리면 즉시 취약점이 된다(과거 `store`/`workspace` POST 2건이 이 이유로 IDOR 취약점이었고, [improvement-backlog.md](../improvement-backlog.md) P1-1로 이미 반영 완료)
- **`services/schedule.ts`의 N+1 패턴**: `fetchSharedCalendarPhases`, `fetchMemberWorkloads`, `fetchPartAllPhases`가 모두 "파트의 서비스 목록 조회 → 서비스마다 개별 `fetchServiceWithData` 호출"을 반복한다. 서비스 수가 늘면 요청 수가 선형 증가하고, 개별 실패는 `catch { /* 무시 */ }`로 조용히 스킵되어 데이터 누락이 사용자에게 보이지 않는다
- **낙관적 업데이트 정책 비일관**: `useScheduleActions` 안에서도 생성 계열(`handleAddPhase`, `handleAddTask`)은 서버 응답 후 반영, 수정/삭제 계열은 낙관적 업데이트+롤백으로 서로 다른 패턴을 쓴다. 신규 액션 추가 시 어느 패턴을 따를지 팀 컨벤션이 문서화되어 있지 않다
- **초대코드 발급 UI 부재**: `auth/join` 라우트는 `invite_code_expires_at`(만료 시 410) / `invite_code_single_use`(1회 사용 후 `invite_code`를 null로 무효화)를 실제로 검사·적용한다. 다만 워크스페이스 생성 시점(`app/api/schedule/workspace/route.ts`)에는 만료시각/1회성 여부를 설정하는 입력이 없어 두 컬럼은 항상 기본값(무제한)으로만 채워진다 — 기능은 서버에 구현돼 있지만 발급 경로가 없어 사실상 미사용
- **대형 파일**: `services/schedule.ts`(772줄)가 서비스 레이어 안에서 가장 크다. [improvement-backlog.md](../improvement-backlog.md) P2-6(대형 파일 분해)·P2-7(any 제거, 이미 반영 완료)의 대상
- **테스트 부재**: 세션 발급·롤백·워크로드 집계 등 상태가 복잡한 로직이 많은데 자동화 테스트가 없어 회귀 위험이 수동 QA에 의존한다
