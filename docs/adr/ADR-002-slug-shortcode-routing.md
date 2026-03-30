# ADR-002 슬러그 + 쇼트코드 라우팅 채택

상태: Accepted  
작성일: 2026-03-18

---

## Context

약속 잡기와 N빵 계산기는 방 공유가 중요하다.  
UUID 기반 주소는 공유는 가능하지만 사람이 읽기 어렵고, 링크 자체로 어떤 방인지 판단하기 어렵다.

---

## Decision

meeting, calc 계열 라우트는 `slug-short_code` 패턴을 채택한다.

예:

- `/meeting/room/<slug>-<shortCode>`
- `/calc/<slug>-<shortCode>`

---

## Rationale

- 공유 링크의 가독성 향상
- 운영 중 링크 식별성 향상
- URL이 콘텐츠 의미를 어느 정도 전달

---

## Consequences

### Positive

- 사용자 친화적 링크
- 복사/공유 시 품질 향상
- UUID 직접 노출 감소

### Negative

- slug 관리 필요
- short code 충돌 회피 로직 필요
- 기존 UUID 링크 호환 처리 필요

---

## Follow-up

- short code 생성 규칙 문서화
- collision handling 테스트 강화
- 라우트 파싱 유틸 표준화
