# Supabase 도메인 맵

상태: Working Draft  
작성일: 2026-03-18  
주의: 이 문서는 현재 코드에서 추론한 도메인 맵이며, 실제 DB 스키마와 1:1 보장을 의미하지 않는다.

---

## 1. 목적

이 문서는 Supabase를 사용하는 메뉴들이 어떤 도메인 단위로 테이블을 나누고 있는지, 프론트엔드가 어떤 형태로 접근하는지 설명한다.

---

## 2. 도메인별 분류

### 약속 잡기 도메인

추정 테이블:

- `rooms`
- `participants`

핵심 특징:

- 방 중심
- 참가자별 불가능 날짜 저장
- 최종 확정 날짜 저장
- 정산기 연결 필드(`calc_room_id`) 보유

프론트 접근 위치:

- `hooks/useCreateRoom.ts`
- `hooks/useRoom.ts`

---

### N빵 계산기 도메인

추정 테이블:

- `calc_rooms`
- `calc_members`
- `calc_expenses`

RPC:

- `calc_replace_room_data`

핵심 특징:

- 방 개념
- 멤버 목록과 비용 목록 분리
- 프론트에서 전체 상태를 RPC로 치환하는 패턴 사용

프론트 접근 위치:

- `hooks/useCalcPersistence.ts`

---

### 습관 관리 도메인

추정 테이블:

- `goals`
- `goal_items`
- `goal_logs`

핵심 특징:

- 목표 -> 세부 항목 -> 날짜별 로그
- 월간 집계와 일간 완료 상태 조회가 쉬운 구조

프론트 접근 위치:

- `app/habit/page.tsx`
- `app/habit/[id]/page.tsx`
- `app/habit/useMonthlyTracker.ts`

---

### 체중 관리 도메인

추정 테이블:

- `diet_goals`
- `diet_logs`

핵심 특징:

- 목표 단위
- 날짜별 로그
- 식사/몸무게/메모를 한 row에서 관리

프론트 접근 위치:

- `app/diet/page.tsx`
- `app/diet/[id]/page.tsx`
- `app/diet/DietMainContent.tsx`

---

### 게임 도메인

추정 테이블:

- `game_rooms`
- `game_participants`

핵심 특징:

- 방 상태
- 게임 종류
- 참가자 정보
- 실시간 구독

프론트 접근 위치:

- `app/game/page.tsx`
- `hooks/useGameRoom.ts`

---

### 일정 관리 도메인

명확한 테이블:

- `schedule_boards`
- `schedule_services`
- `schedule_tasks`

핵심 특징:

- 보드 > 서비스 > 태스크 3계층
- CRUD와 뷰 전환 중심
- service layer 존재

프론트 접근 위치:

- `services/schedule.ts`
- `app/schedule/*`

---

## 3. 도메인 공통 패턴

### 방 / 보드 / 목표 중심 루트 엔티티

Supabase 메뉴 대부분은 루트 엔티티를 하나 둔다.

- 약속 잡기: room
- 정산기: calc room
- 습관: goal
- 다이어트: goal
- 게임: room
- 일정: board

이 패턴은 UI 라우팅과도 잘 맞는다.

---

## 4. 접근 패턴 차이

### 패턴 A. 훅에서 직접 Supabase 호출

예:

- meeting
- habit
- diet
- game

장점:

- 구현 빠름
- 파일 수 적음

단점:

- DB 구조가 UI/훅에 새어 나옴
- 재사용성 떨어짐

### 패턴 B. service 레이어 사용

예:

- schedule

장점:

- 화면과 DB 접근 분리
- 변환 로직 중앙화

단점:

- 초반 구현 비용 증가

### 패턴 C. RPC 중심

예:

- calc

장점:

- 다중 row 갱신 일관성 확보

단점:

- RPC 스펙 변경 시 프론트-백 결합도 증가

---

## 5. 권장 표준

향후 Supabase 메뉴는 아래 기준으로 정리하는 것이 좋다.

1. 루트 엔티티 정의
2. service/repository 레이어 존재
3. UI 모델과 DB row 변환 함수 분리
4. 쓰기 전략 명시
   - row CRUD
   - batch update
   - RPC
5. 실시간 여부 명시

---

## 6. 결론

황총무의 Supabase 구조는 도메인별 분리가 비교적 잘 되어 있지만, 접근 방식은 아직 통일되어 있지 않다.  
따라서 다음 단계는 테이블을 바꾸는 것이 아니라, **접근 패턴의 문서화와 표준화**다.
