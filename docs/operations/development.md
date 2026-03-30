# 개발 및 실행 가이드

상태: Active  
작성일: 2026-03-18  
대상: 신규 개발자 / 로컬 실행 담당자

---

## 1. 요구 환경

- Node.js 20 계열 권장
- npm 사용 기준
- Supabase 프로젝트 접근 정보 필요

---

## 2. 설치

```bash
npm install
```

워크스페이스 구조:

- 루트 앱
- `packages/ui`

따라서 루트에서 설치해야 공용 UI 패키지까지 함께 연결된다.

---

## 3. 실행

```bash
npm run dev
```

기본 개발 서버:

- `http://localhost:3000`

문서 페이지:

- `/docs`

---

## 4. 주요 스크립트

### 개발 서버

```bash
npm run dev
```

### 타입체크

```bash
npx tsc --noEmit
```

### 린트

```bash
npx eslint .
```

---

## 5. 환경 변수

필요 환경 변수 예시:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ADMIN_PASSWORD`

설명:

- Supabase 메뉴는 URL/anon key가 없으면 동작하지 않는다
- 업무 캘린더 접근용 비밀번호는 login/middleware 흐름에서 사용된다

---

## 6. 로컬 실행 시 주의사항

### localStorage 기반 메뉴

아래 메뉴는 브라우저 상태에 의존한다.

- 가계부
- 일일 기록

따라서 테스트 시:

- 시크릿 모드 여부
- 브라우저 스토리지 초기화 여부
- 기존 테스트 데이터 잔존 여부

를 함께 확인해야 한다.

### Supabase 기반 메뉴

테스트 중 실제 DB가 오염될 수 있다.  
공용 프로젝트를 쓰는 경우 테스트 네이밍 규칙 또는 별도 환경 분리가 필요하다.

---

## 7. 디버깅 포인트

### styled-components 관련 에러

- server/client 경계 확인
- `use client` 누락 여부 확인
- `StyledComponentsRegistry` 아래에서 렌더되는지 확인

### schedule 접근 불가

- 쿠키 `auth_token` 확인
- `/login`에서 비밀번호 처리 확인

### Supabase 데이터 불일치

- slug/shortCode 파싱
- RPC 호출 에러 로그
- direct query와 service layer 반환값 차이 확인

---

## 8. 권장 개발 절차

1. 관련 메뉴 문서 읽기
2. storage 또는 service 레이어 확인
3. 훅과 컨테이너 구조 확인
4. 타입체크 / 린트 실행
5. 기능별 수동 검증

---

## 9. 문서와 코드의 관계

개발자는 기능을 변경할 때 아래 문서 갱신 여부를 같이 확인한다.

- 메뉴별 상세 문서
- 저장 전략 문서
- ADR
- 리팩토링 로드맵
