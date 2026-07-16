# 아키텍처 문서

## 공통

- [system-overview.md](system-overview.md) — 시스템 전체 개요
- [frontend-runtime.md](frontend-runtime.md) — 프론트엔드 런타임 구성
- [menu-composition.md](menu-composition.md) — 메뉴 구성
- [menu-md-vibe-coding-guide.md](menu-md-vibe-coding-guide.md) — 메뉴 문서 작성 가이드

## 서비스별 구조 설계 (2026-07-15)

각 서비스의 도메인 모델·화면 구조·저장 아키텍처를 동일한 틀(개요 → 컴포넌트 트리 → 데이터 모델 → 저장 → 도메인 로직 → 제약/후속 과제)로 정리. 메뉴 관점 분석은 [menu-details/](../menu-details/) 참고.

| 서비스 | 문서 | 저장 방식 요약 |
|---|---|---|
| 가계부 | [account-book-structure.md](account-book-structure.md) | Supabase RPC(SECURITY DEFINER) + 로컬 폴백, 3중 화이트리스트 주의 |
| 업무 캘린더 | [schedule-structure.md](schedule-structure.md) | **유일한 서버 세션 인증** (API 라우트 + scrypt/HMAC), services/ 데이터 레이어 |
| 운동 | [workout-structure.md](workout-structure.md) | 방 이름+비밀번호, Supabase 직접(repository.ts), OCR |
| 야근 계산기 | [overtime-structure.md](overtime-structure.md) | localStorage + Supabase 병행, OCR |
| 모임 일정 | [meeting-structure.md](meeting-structure.md) | rooms/participants/confirm_votes, 단축코드 슬러그 |
| 정산기 | [calc-structure.md](calc-structure.md) | localStorage + calc_rooms 자동저장 |
| 게임방 | [game-structure.md](game-structure.md) | game_rooms/game_participants, 컴포넌트 직접 쿼리 |
| 습관 | [habit-structure.md](habit-structure.md) | goal_items/goal_logs 직접 쿼리 |
| 일일 저널 | [daily-structure.md](daily-structure.md) | repository/storage 이중 구조, 보안 테이블 |
| 식단 | [diet-structure.md](diet-structure.md) | 컴포넌트 직접 쿼리 (데이터 레이어 부재) |
| 인바디 | [inbody-structure.md](inbody-structure.md) | repository/storage 이중 구조 |
| 장소 투표 | [place-structure.md](place-structure.md) | dinner_rooms + 네이버 검색 프록시 |
| 포트폴리오 | [portfolio-structure.md](portfolio-structure.md) | 정적 (저장 없음) |
