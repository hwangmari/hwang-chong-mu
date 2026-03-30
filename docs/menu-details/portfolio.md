# 포트폴리오 상세 분석

## 1. 메뉴 목적

포트폴리오는 개발자 소개, 실무 경험, 토이 프로젝트, UI Kit 문서를 한데 보여주는 브랜딩/문서 허브다.

## 2. 라우트 구조

- 메인: `/portfolio`
- 경험 상세: `/portfolio/experience/[id]`
- 보조 문서: `/ui-kit`

## 3. 핵심 파일 구조

```text
app/portfolio/page.tsx
app/portfolio/PortfolioInfo.tsx
app/portfolio/ResumeSection.tsx
app/portfolio/project/ProjectSection.tsx
app/portfolio/project/ProjectList.tsx
app/portfolio/experience/[id]/page.tsx
data/experiences.tsx
app/ui-kit/page.tsx
```

## 4. 메인 페이지 구조

포트폴리오 메인은 4단 구성이 명확하다.

1. 소개/외부 링크
2. 이력서
3. 토이 프로젝트
4. 푸터

특징:

- `PortfolioInfo`에서 소개, GitHub, Blog, Email 링크 제공
- `ProjectSection`에서 토이 프로젝트와 핵심 기술 스택 노출
- `/ui-kit` 링크를 명시적으로 강조

## 5. 데이터 구조 분석

이 메뉴는 정적 데이터 중심이다.

주요 데이터 파일:

- `data/experiences.tsx`
- `data/constants.ts`

즉, CMS보다 코드 기반 문서 관리에 가깝다.

장점:

- 버전 관리가 쉽다
- 컴포넌트와 콘텐츠를 같이 다루기 좋다

단점:

- 콘텐츠 규모가 커질수록 관리 부담이 생긴다

## 6. 프로젝트 섹션 분석

`ProjectSection`은 단순 프로젝트 리스트가 아니라 메타 성격이 강하다.

- Core tech stack 노출
- 개발 철학 소개
- 토이 프로젝트 빠른 이동 네비게이션
- UI Kit 링크

즉, "이 프로젝트들을 왜 만들었는가"까지 서사로 묶는다.

## 7. UI Kit 분석

`/ui-kit`은 실제로 작은 문서 사이트다.

- Hero
- 왼쪽 네비게이션
- 메인 본문
- 오른쪽 TOC
- 코드 복사 기능

이 메뉴는 황총무 프로젝트가 단순 서비스 묶음을 넘어 공용 디자인 자산 정리 단계로 가고 있다는 신호다.

## 8. 사용자 시나리오

1. 개발자 소개 확인
2. 경력과 프로젝트 열람
3. 토이 프로젝트 사례 탐색
4. UI Kit 문서 확인
5. 경험 상세 페이지 진입

## 9. 강점

- 브랜딩과 프로젝트 아카이브를 함께 담는다
- 실무 경력과 토이 프로젝트가 자연스럽게 연결된다
- UI Kit까지 포함해 "개발 결과물의 문서화"가 보인다

## 10. 한계

- 콘텐츠가 코드에 강하게 결합돼 있다
- 문서 관리 툴로서 확장되진 않았다
- 검색/필터 기능은 아직 약하다

## 11. 개선 제안

- 프로젝트/경험 필터링
- 태그 기반 탐색
- 포트폴리오 데이터 CMS 또는 JSON 분리
- 프로젝트별 기술 문제/해결 방식 카드 추가
- 황총무 서비스 문서와 포트폴리오 문서 연결 강화
