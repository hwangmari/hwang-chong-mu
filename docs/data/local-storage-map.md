# Local Storage 맵

상태: Active  
작성일: 2026-03-18  
목적: localStorage를 사용하는 메뉴의 저장 키, 데이터 모델, 위험요소를 정리

---

## 1. 범위

현재 localStorage 기반 메뉴:

- 가계부
- 일일 기록
- 일부 부가 설정
  - 습관 관리의 주말 보기 설정
  - 게임방의 닉네임 저장

---

## 2. 가계부 저장 구조

주요 키:

- `hwang-account-book-store-v1`
- `hwang-account-book-v2` (legacy migration 대상)

### 스토어 구조

- `version`
- `users`
- `workspaces`
- `entries`
- `shareLinks`

### 특징

- 브라우저 내에서 멀티 워크스페이스 회계 시스템을 구성
- 개인방 / 공용방 개념 존재
- 엔트리 공유와 미러링 개념 존재
- legacy 데이터 마이그레이션 로직 존재

### 리스크

- 구조가 복잡한 만큼 데이터 깨짐 시 복구 어려움
- 브라우저 단위 저장이라 기기 이전 불가

---

## 3. 일일 기록 저장 구조

주요 키:

- `daily-notebooks`
- `daily-notebook-entries:${notebookId}`
- session storage: `daily-unlocked:${notebookId}`

### 저장 모델

#### notebook config

- id
- title
- checklist
- monthlyChecklists
- accessCode
- color

#### daily entry

- date
- diary
- checks

### 특징

- 메타와 엔트리를 분리 저장
- 월별 체크리스트 변형 지원
- 비밀번호 잠금 상태는 session storage 활용

### 장점

- localStorage형 메뉴 중 모델 정리가 가장 잘 되어 있음

---

## 4. 부가 로컬 상태

### 습관 관리

- `showWeekends_${goalId}`

의미:

- 주말 표시 여부 사용자 선호 저장

### 게임방

- `my_id`
- `my_nickname`

의미:

- 방 재입장 보조 정보

---

## 5. 권장 관리 원칙

localStorage 기반 기능은 아래 기준을 지킨다.

1. 직접 `window.localStorage` 접근을 페이지에 분산하지 말 것
2. 반드시 `storage.ts` 또는 별도 모듈에서 키를 관리할 것
3. 마이그레이션 대상 키는 명시할 것
4. export/import 전략을 문서화할 것
5. "이 브라우저에 저장된다"는 UX 문구를 제공할 것

---

## 6. 결론

localStorage는 빠르고 유용하지만, 문서화되지 않으면 가장 위험한 저장소다.  
특히 가계부처럼 구조가 커진 메뉴는 스키마 관리와 백업 전략이 반드시 필요하다.
