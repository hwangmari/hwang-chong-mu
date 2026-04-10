# 블로그 상세 분석

## 1. 메뉴 목적

블로그는 황총무의 실험실에서 만든 서비스들의 개발 과정, 기술 이야기, 서비스 소개를 글 형태로 기록하는 콘텐츠 페이지다.
Google AdSense 승인을 위한 콘텐츠 기반 페이지 역할도 겸한다.

## 2. 라우트 구조

- 목록 페이지: `/blog`
- 상세 페이지: `/blog/[id]`

## 3. 핵심 파일 구조

```text
app/blog/page.tsx          # 블로그 목록 페이지
app/blog/[id]/page.tsx     # 블로그 상세 페이지
app/blog/data.ts           # 블로그 데이터 (하드코딩)
```

## 4. 목록 페이지 분석

목록 페이지는 `PageIntro`, 카테고리 필터, 포스트 리스트의 3단 구조다.

### 카테고리 필터

- 전체 / 서비스 소개 / 개발 일지 / 기술 이야기
- `useState`로 활성 카테고리 관리
- 탭 클릭 시 해당 카테고리의 글만 필터링

### 포스트 카드

- 이모지 아이콘 + 카테고리 뱃지 + 날짜 + 제목 + 요약
- 클릭 시 `/blog/[id]`로 이동 (Next.js Link)
- hover 시 카드 상승 애니메이션

## 5. 상세 페이지 분석

상세 페이지는 `useParams`로 id를 받아 `BLOG_POSTS`에서 해당 글을 찾아 렌더링한다.

### 콘텐츠 블록 타입

- `heading` — 소제목 (h2, border-bottom)
- `paragraph` — 본문 텍스트
- `list` — 불릿 리스트
- `quote` — 인용구 (파란 왼쪽 보더)
- `code` — 코드 블록 (다크 배경)

### 데이터 구조

```typescript
interface ContentBlock {
  type: "heading" | "paragraph" | "list" | "quote" | "code";
  text?: string;
  items?: string[];
}

interface BlogPost {
  id: string;
  emoji: string;
  title: string;
  summary: string;
  date: string;
  category: string;
  content: ContentBlock[];
}
```

## 6. 저장 방식

현재 하드코딩된 정적 데이터(`app/blog/data.ts`)를 사용한다. DB 연동 없음.

## 7. 기술적 강점

- 카테고리 필터링이 클라이언트에서 즉시 동작
- 콘텐츠 블록 기반 렌더링으로 다양한 형식 지원
- 기존 프로젝트 스타일(StContainer, StWrapper, StSection) 일관 적용

## 8. 구조적 한계

- 글 데이터가 하드코딩되어 있어 CMS 없이는 글 추가/수정이 코드 수정 필요
- 검색, 페이지네이션 미지원
- SEO 최적화(메타태그, OG 이미지) 미적용

## 9. 개선 제안

- Supabase 테이블로 블로그 데이터 이관 → 동적 글 관리
- MDX 또는 에디터 기반 글 작성 도구 추가
- 글별 OG 이미지 자동 생성 (기존 opengraph-image 패턴 활용)
- 댓글/좋아요 기능 추가 가능
