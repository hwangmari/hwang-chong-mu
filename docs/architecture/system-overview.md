# 아키텍처 개요

상태: Active  
작성일: 2026-03-18  
대상: 신규 개발자, 기술 리드, 유지보수 담당자  
관련 문서:

- [프론트엔드 런타임 구조](./frontend-runtime.md)
- [메뉴 구성 및 책임 분리](./menu-composition.md)
- [저장 전략](../data/persistence-strategy.md)

---

## 1. 목적

이 문서는 황총무 프로젝트를 "무엇을 만드는 서비스인가"가 아니라, "어떤 구조로 묶여 있는 애플리케이션인가" 관점에서 설명한다.  
특히 메뉴가 많은 멀티 툴 제품에서 아래 질문에 답하는 것을 목표로 한다.

- 프로젝트는 단일 도메인 앱인가, 멀티 도메인 앱인가?
- 공통 레이어는 어디까지 공유하는가?
- 어떤 메뉴가 어떤 저장소를 쓰는가?
- 메뉴 간 직접 연결은 어디에서 발생하는가?

---

## 2. 시스템 성격

황총무는 하나의 Next.js 애플리케이션 안에 여러 개의 생활/업무 도구가 공존하는 **멀티 서비스형 프론트엔드**다.

핵심 메뉴:

- 약속 잡기
- N빵 계산기
- 가계부
- 습관 관리
- 일일 기록
- 체중 관리
- 게임방
- 업무 캘린더
- 포트폴리오 / UI Kit

구조적으로는 "마이크로 프론트엔드"까지는 아니지만, 하나의 앱 안에 여러 개의 독립 도메인이 느슨하게 결합된 형태에 가깝다.

---

## 3. 최상위 구조

```text
Next.js App Router
 ├─ app/layout.tsx
 │   ├─ StyledComponentsRegistry
 │   ├─ ModalProvider
 │   └─ GlobalHeader
 ├─ app/page.tsx
 │   └─ 메뉴 허브
 ├─ app/<menu>/...
 ├─ components/common/*
 ├─ hooks/*
 ├─ services/*
 ├─ lib/*
 ├─ data/*
 └─ docs/*
```

### 핵심 포인트

- `app/page.tsx`는 홈 메뉴 허브 역할
- `app/layout.tsx`는 전역 UI/스타일/모달 레이어를 제공
- 메뉴별 구현은 `app/<menu>` 기준으로 비교적 독립적으로 분리
- 공통 동작은 `components/common`, `hooks`, `services`, `lib`에 배치

---

## 4. 아키텍처 레이어

### 4-1. Presentation Layer

역할:

- 페이지 컴포넌트
- 메뉴별 화면 조립
- 공통 UI 컴포넌트 사용

위치:

- `app/*`
- `components/common/*`
- `packages/ui/*`

특징:

- 메뉴별 페이지는 대부분 client component
- styled-components 기반 UI 작성
- 일부 메뉴는 공통 래퍼(`StContainer`, `StWrapper`)를 사용

### 4-2. Interaction / Feature Logic Layer

역할:

- 사용자 액션 처리
- 로컬 상태 관리
- 비즈니스 규칙 적용
- 메뉴별 흐름 제어

위치:

- `hooks/*`
- 일부 메뉴의 컨테이너 컴포넌트 내부

예:

- `useRoom`
- `useCreateRoom`
- `useCalcPersistence`
- `useCalculator`
- `useGameRoom`
- `useMonthlyTracker`

### 4-3. Data Access Layer

역할:

- Supabase 접근
- localStorage 접근
- RPC 호출
- DB row -> 프론트 모델 변환

위치:

- `services/*`
- `app/*/storage.ts`
- `lib/supabase.js`

### 4-4. Metadata / Content Layer

역할:

- 프로젝트 설명 데이터
- 포트폴리오 콘텐츠
- 가이드 문구

위치:

- `data/*`

---

## 5. 저장소 전략 개요

황총무는 단일 저장 전략을 사용하지 않는다.  
도메인 특성에 따라 저장소를 다르게 선택한 **하이브리드 persistence 구조**다.

### Supabase 기반 메뉴

- 약속 잡기
- N빵 계산기
- 습관 관리
- 체중 관리
- 게임방
- 업무 캘린더

선택 이유:

- 다중 사용자 또는 공유 데이터
- 방 개념
- 실시간/서버 저장 필요

### localStorage 기반 메뉴

- 가계부
- 일일 기록

선택 이유:

- 개인 중심 기능
- 빠른 프로토타이핑
- 서버 의존 최소화

이 구조는 개발 속도에는 강하지만, 운영 일관성 측면에서는 비용이 있다.

---

## 6. 메뉴 간 연결

### 직접 연결

#### 약속 잡기 -> N빵 계산기

확정된 날짜와 참석자 기준으로 정산 방을 생성하거나 갱신한다.  
이 연결은 황총무 전체에서 가장 강한 메뉴 간 연결이다.

#### 포트폴리오 -> UI Kit

문서형 연결로, 공용 UI 체계를 별도 페이지에서 열람하도록 유도한다.

### 간접 연결

- GlobalHeader가 모든 메뉴를 횡단한다.
- 공통 버튼/모달/가이드가 메뉴 UX를 느슨하게 통일한다.
- 포트폴리오에서 토이 프로젝트를 다시 소개해 제품과 문서를 연결한다.

---

## 7. 전역 공통 레이어

### Styled Components Registry

`lib/registry.tsx`는 Next.js 환경에서 styled-components SSR을 안전하게 주입하는 역할을 한다.

역할:

- 서버 사이드 스타일 수집
- 클라이언트/서버 렌더링 경계 보정
- `UiProvider` 감싸기

### ModalProvider

`components/common/ModalProvider.tsx`는 `openAlert`, `openConfirm` 스타일의 전역 모달 인터페이스를 제공한다.

의의:

- 메뉴별로 confirm/alert 구현을 중복하지 않게 한다
- 비동기 액션 흐름을 Promise 기반으로 단순화한다

### GlobalHeader

`components/common/GlobalHeader.tsx`는 현재 경로에 따라 제목을 바꾸고 전역 메뉴 접근점을 제공한다.

역할:

- 현재 메뉴 제목 표시
- 뒤로 가기 제어
- 햄버거 메뉴 네비게이션

의미:

- 여러 독립 메뉴를 하나의 제품으로 느끼게 만드는 공통 UX 레이어

---

## 8. 라우팅 전략

### App Router 기준 정적/동적 라우트 혼합

정적:

- `/meeting`
- `/calc`
- `/daily`
- `/schedule`

동적:

- `/meeting/room/[id]`
- `/calc/[id]`
- `/daily/[id]`
- `/schedule/[id]`
- `/game/[id]`

### 사람이 읽기 쉬운 주소 전략

meeting, calc는 UUID 대신 `slug-short_code` 패턴을 사용한다.

의도:

- 공유 링크 품질 향상
- 주소 가독성 향상
- 운영 중 링크 식별성 강화

---

## 9. 주요 아키텍처 장점

- 메뉴별 도메인 경계가 비교적 분명하다
- 공통 UI 레이어와 개별 도메인 로직이 분리되어 있다
- 빠른 실험이 가능하다
- 저장소 선택이 도메인 목적과 대체로 맞는다
- 문서화 가능한 구조가 이미 존재한다

---

## 10. 주요 아키텍처 리스크

- 저장 전략 혼재로 인한 운영 일관성 부족
- 메뉴별 코드 스타일 편차
- 일부 훅에 비즈니스 로직이 많이 집중됨
- 실시간 / polling / local-only 패턴이 공존
- 보안/접근 제어가 메뉴마다 다름

---

## 11. 권장 방향

중장기적으로는 아래 방향이 바람직하다.

1. 공통 문서와 설계 기준을 먼저 정리
2. 저장 전략과 인증 전략을 메뉴별로 명시
3. 실시간성이 필요한 메뉴와 아닌 메뉴를 분리
4. localStorage형 메뉴에 백업/동기화 전략 추가
5. 공통 레이어 재사용 규칙 정리

이 문서는 "현재 구조를 이해하는 문서"이며, 실제 개선 순서는 [리팩토링 우선순위](../roadmap/refactoring-priorities.md) 문서를 기준으로 진행한다.
