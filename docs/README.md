# 황총무 기술 문서 인덱스

문서 버전: 2026-03-18  
대상 독자: 신규 개발자, 유지보수 담당자, 리팩토링 참여자  
문서 목표: 황총무 프로젝트의 현재 구조, 기술 선택, 저장 전략, 운영 방식, 개선 우선순위를 실무형 문서 구조로 정리

---

## 1. 문서 체계

이 `docs/` 폴더는 다음 6개 층위로 구성한다.

1. **Overview**
   - 프로젝트 전체 맥락과 메뉴 지도
2. **Architecture**
   - 프론트엔드 구조, 라우팅, 상태/렌더링 경계, 공통 레이어
3. **Data**
   - Supabase, localStorage, 메뉴별 저장 전략, 데이터 책임 분리
4. **ADR**
   - 중요한 설계 의사결정과 그 배경
5. **Operations**
   - 개발/실행/접근 제어/운영 시 주의사항
6. **Roadmap**
   - 리팩토링 우선순위, 기술부채 정리 방향

---

## 2. 먼저 읽을 문서

### 입문용 순서

1. [프로젝트 전체 메뉴 분석](./hwang-chong-mu-menu-analysis.md)
2. [아키텍처 개요](./architecture/system-overview.md)
3. [저장 전략](./data/persistence-strategy.md)
4. [리팩토링 우선순위](./roadmap/refactoring-priorities.md)

### 신규 개발자 온보딩 순서

1. [아키텍처 개요](./architecture/system-overview.md)
2. [프론트엔드 런타임 구조](./architecture/frontend-runtime.md)
3. [Supabase 도메인 맵](./data/supabase-domain-map.md)
4. [Local Storage 맵](./data/local-storage-map.md)
5. [개발 및 실행 가이드](./operations/development.md)

### 기능 유지보수 순서

1. [메뉴별 상세 문서 인덱스](./menu-details/README.md)
2. 해당 메뉴 문서
3. [저장 전략](./data/persistence-strategy.md)
4. 관련 ADR

---

## 3. 문서 목록

### Overview

- [프로젝트 전체 메뉴 분석](./hwang-chong-mu-menu-analysis.md)
- [메뉴별 상세 문서 인덱스](./menu-details/README.md)

### Architecture

- [아키텍처 개요](./architecture/system-overview.md)
- [프론트엔드 런타임 구조](./architecture/frontend-runtime.md)
- [메뉴 구성 및 책임 분리](./architecture/menu-composition.md)

### Data

- [저장 전략](./data/persistence-strategy.md)
- [Supabase 도메인 맵](./data/supabase-domain-map.md)
- [Local Storage 맵](./data/local-storage-map.md)

### ADR

- [ADR-001 하이브리드 저장 전략 채택](./adr/ADR-001-hybrid-persistence-strategy.md)
- [ADR-002 슬러그 + 쇼트코드 라우팅 채택](./adr/ADR-002-slug-shortcode-routing.md)

### History

- [기술 진화 히스토리](./history/technical-evolution.md)

### Operations

- [개발 및 실행 가이드](./operations/development.md)
- [접근 제어 및 보안 메모](./operations/security-and-access.md)

### Roadmap

- [리팩토링 우선순위](./roadmap/refactoring-priorities.md)

---

## 4. 문서 작성 원칙

이 문서 세트는 다음 원칙을 따른다.

- 현재 코드 기준으로 작성한다.
- 구현 세부보다 **책임 경계**와 **데이터 흐름**을 우선 기록한다.
- 추정이 필요한 경우 문서에서 명시적으로 "추정"이라고 표현한다.
- 메뉴 문서는 사용자 흐름과 화면 구조를 설명하고,
  아키텍처/데이터 문서는 공통 구조를 설명한다.
- 리팩토링 문서는 문제 나열보다 **우선순위와 영향도**를 함께 기록한다.

---

## 5. 다음 문서 후보

현재 문서 세트 이후 추가하면 좋은 문서:

- DB 테이블 ERD
- API / RPC 명세서
- 메뉴별 장애 시나리오 문서
- 테스트 전략 문서
- 배포/릴리즈 체크리스트
