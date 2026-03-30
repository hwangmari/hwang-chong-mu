# 약속 잡기 상세 분석

## 1. 메뉴 목적

약속 잡기는 여러 사람이 가능한 날짜를 모아 최종 약속일을 정하는 협업형 일정 조율 도구다.  
이 메뉴의 핵심 UX는 "가능한 날짜를 고르기"보다 "안 되는 날짜를 제거하기"에 있다.

## 2. 라우트 구조

- 생성 페이지: `/meeting`
- 상세 페이지: `/meeting/room/[id]`
- 보조 파일:
  - `app/meeting/create-room/RoomForm.tsx`
  - `hooks/useCreateRoom.ts`
  - `hooks/useRoom.ts`

## 3. 핵심 파일 구조

```text
app/meeting/page.tsx
app/meeting/create-room/RoomForm.tsx
hooks/useCreateRoom.ts
app/meeting/room/[id]/page.tsx
hooks/useRoom.ts
app/meeting/room/detail/*
```

역할 분담은 비교적 명확하다.

- 생성 페이지는 소개 + 폼 + 가이드
- `useCreateRoom`은 생성 로직 담당
- 상세 페이지는 `useRoom`에서 대부분의 상태를 받음
- 세부 UI는 `detail` 폴더로 잘게 쪼개져 있음

## 4. 생성 페이지 분석

생성 페이지는 `PageIntro`, `RoomForm`, `FooterGuide`의 3단 구조다.

입력값:

- 방 이름
- 시작일
- 종료일 또는 자동 계산 기간
- 주말 포함 여부

`useCreateRoom`에서 중요한 점은 종료일 자동 계산 로직이다.

- 사용자가 종료일을 직접 고르지 않으면
- 시작일 기준으로 2주 + 남은 주말을 반영한 범위를 자동 산출한다

즉, UX는 간단하지만 실제 일정 수집 범위는 자동 보정된다.

## 5. 상세 페이지 분석

상세 페이지는 사실상 협업 상태 머신이다.

상태 단계:

- `VOTING`
- `CONFIRM`

핵심 표시 요소:

- `RoomHeader`
- `CalendarGrid`
- `NameInput`
- `DateControlButtons`
- `ParticipantList`
- `VoteSubmitButtons`
- `FloatingFinishButton`
- `ConfirmedResultCard`

즉, 화면은 "입력 / 달력 / 참가자 / 확정"이라는 기능 단위로 쪼개져 있다.

## 6. 상태와 데이터 흐름

실질적인 엔진은 `useRoom`이다.

이 훅이 담당하는 것:

- 방 데이터 로딩
- 참가자 목록 로딩
- 확정 날짜 여부 판단
- 현재 입력 중인 이름 관리
- 현재 유저의 불가능 날짜 관리
- 참가자 수정/삭제
- 최종 확정 처리
- 모달 상태 관리

즉, 상세 페이지 컴포넌트는 주로 뷰 레이어이고, 비즈니스 로직은 훅에 집중되어 있다.

## 7. DB 구조 추정

코드 기준으로 추정되는 주요 테이블/필드는 아래와 같다.

### `rooms`

- `id`
- `name`
- `start_date`
- `end_date`
- `include_weekend`
- `slug`
- `short_code`
- `confirmed_date`
- `calc_room_id`

### `participants`

- `id`
- `room_id`
- `name`
- `unavailable_dates`
- `is_absent`

## 8. 사용자 시나리오

1. 사용자가 방 생성
2. 공유 링크 전달
3. 각 참가자가 이름 입력
4. 불가능한 날짜 선택
5. 참가자 목록 누적
6. 후보 날짜 확인
7. 최종 날짜 확정
8. 필요 시 N빵 계산기로 이동

이 흐름은 "모임 생성 -> 참석 확인 -> 정산"으로 이어지는 실제 오프라인 이벤트 흐름과 매우 잘 맞는다.

## 9. 기술적 특징

### 9-1. 주소 체계

- UUID 직접 노출 대신 `slug-short_code` 주소 사용
- 사람이 읽을 수 있는 링크를 제공
- 기존 UUID 링크도 들어오면 사람이 읽기 쉬운 주소로 교체

### 9-2. 동기화 방식

- 실시간 구독이 아니라 3초 polling 기반
- 구현은 단순하지만 사용자 수가 많아지면 비효율 가능성 존재

### 9-3. 타 메뉴 연결

- `calc_room_id`를 통해 N빵 계산기와 연결
- 약속 확정 후 정산 방 생성/갱신 가능

## 10. 강점

- 문제 정의가 명확하다
- 입력 방식이 직관적이다
- 실제 모임 운영 흐름과 잘 맞다
- 정산기로 자연스럽게 이어진다
- 세부 UI가 잘 분리되어 유지보수성이 괜찮다

## 11. 한계

- polling 기반이라 실시간성/비용 면에서 아쉬움
- 이름 기반 수정/삭제 흐름이 동명이인에 약할 수 있음
- 권한 개념이 강하지 않아 링크 기반 참여에서 통제력이 약함

## 12. 개선 제안

- Supabase realtime 기반으로 전환 검토
- 참가자별 고유 토큰 또는 재접속 인증 설계
- "가장 많은 인원이 가능한 날짜" 자동 추천 UI 강화
- 확정 이후 캘린더 저장/공유 UX 정교화
- 참석 확정 멤버 기준 후속 액션 템플릿 제공
  - 정산
  - 공지 복사
  - 캘린더 등록
