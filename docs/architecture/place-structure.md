# 장소 투표 서비스 구조 설계

> 2026-07-15 기준. 장소 투표(place, 회식 장소 투표) 서비스의 도메인 모델, 화면 구조, 저장 방식을 정리한다.
> 전체 개선 항목은 [improvement-backlog.md](../improvement-backlog.md) 참고. (별도 menu-details 문서는 아직 없음)

## 1. 서비스 개요

네이버 지역검색으로 후보 장소를 고르고, 참여자들이 투표해 회식/모임 장소를 정하는 도구.

- **투표방 생성**: 제목 + 검색 키워드로 후보 2곳 이상을 골라 방 생성 (`/place` → `/place/[id]`)
- **투표**: 참여자가 이름을 입력(또는 연동된 미팅룸의 멤버 칩에서 선택)하고 후보를 복수 선택해 투표
- **회의방 연동**: `dinner_rooms.meeting_room_id`가 있으면 `meeting` 서비스의 `participants` 테이블에서 멤버 이름을 가져와 자유 입력 대신 칩으로 제공
- **슬러그+쇼트코드 라우팅**: UUID로 접속하면 `slug-shortCode` 형태로 리다이렉트 — [ADR-002](../adr/ADR-002-slug-shortcode-routing.md)가 meeting·calc 대상으로 정의한 패턴을 place도 동일하게 채택하고 있다 (ADR 자체는 갱신되지 않음)

## 2. 화면·컴포넌트 구조

```text
app/place/page.tsx                     생성 진입 — 네이버 검색 + 지도 + 후보 선택 → 방 생성
├── NaverMap.tsx                       네이버 지도 SDK 동적 로드, 검색 결과 마커/포커스 동기화
└── app/place/[id]/page.tsx            투표 상세 — 상태 허브
    ├── usePlaceVote.ts                방 조회(uuid/slug-code)·장소·투표 CRUD (핵심 훅)
    ├── components/PlaceEditPanel.tsx  후보 추가/삭제 (네이버 재검색 내장)
    ├── components/PlaceCard.tsx       후보별 득표 카드 (막대바, 최다 득표 👑)
    └── components/VotingForm.tsx      투표 폼 (멤버 칩 or 자유 이름 입력)
```

지원 모듈:

| 파일 | 역할 |
|---|---|
| `usePlaceVote.ts` | roomId 해석(uuid ↔ slug-code), places/votes 로드, 투표 제출/재투표, 장소 추가/삭제 |
| `services/dinner.ts` | `dinner_rooms`/`dinner_places`/`dinner_votes` 테이블 CRUD 래퍼 (RPC 미사용) |
| `app/api/naver-search/route.ts` | 네이버 지역검색 프록시 — 서버 전용 env(`NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET`), rate limit 적용 |
| `lib/slug.ts` | `isUuid`/`parseShortCode`/`toSlug`/`createShortCode` |

## 3. 데이터 모델

`types/dinner.ts`:

```ts
interface DinnerRoom {
  id: string;
  title: string;
  area: string;               // 검색 지역 키워드
  created_at: string;
  meeting_room_id?: string | null;  // meeting 서비스와의 연동 키
  short_code?: string | null;
  slug?: string | null;
}

interface DinnerPlace {
  id: string; room_id: string;
  name: string; category: string;
  address: string; road_address: string;
  link: string; map_x: string; map_y: string;
}

interface DinnerVote {
  id: string; room_id: string; place_id: string;
  voter_name: string; created_at: string;
}

interface NaverLocalItem {   // 네이버 지역검색 API 응답 아이템
  title: string; link: string; category: string; description: string;
  telephone: string; address: string; roadAddress: string;
  mapx: string; mapy: string;
}
```

## 4. 저장 아키텍처

account-book·daily와 달리 **RPC 레이어가 없다.** `services/dinner.ts`가 `supabase.from("dinner_rooms"|"dinner_places"|"dinner_votes")`를 직접 호출하는 얇은 CRUD 래퍼이고, `usePlaceVote`도 멤버 이름 조회(`participants`)와 slug-code 조회(`dinner_rooms`)를 위해 `supabase.from(...)`을 직접 호출한다.

```text
[클라이언트]
usePlaceVote
  ├→ isUuid(roomId) ? fetchDinnerRoom(uuid)                 → slug/short_code 있으면 router.replace(`/place/${slug}-${code}`)
  │                  : parseShortCode(roomId) → supabase.from("dinner_rooms").eq("short_code", code)
  ├→ Promise.all([fetchDinnerPlaces, fetchVotes])
  └→ meeting_room_id 있으면 supabase.from("participants") (is_absent 제외) → memberNames
```

- 검색 프록시(`/api/naver-search`)는 IP 기준 `checkRateLimit(key, 10, 60_000)`으로 분당 10회 제한, 쿼리 길이 100자 제한을 둔다 (`lib/rate-limit.ts`, 인메모리 버킷 — 서버리스 다중 인스턴스에서는 인스턴스별로 분리되어 완벽하지 않음을 주석으로 명시)
- 테이블 직접 CRUD이므로 RLS 정책에 의존한다 — account-book/daily처럼 RPC 함수 내부에서 명시적 권한 검증을 하지 않는다

## 5. 도메인 로직 메모

- **네이버 검색**: `display=5&sort=comment`로 페이지당 5건, "더보기"는 `start` 파라미터를 증가시키며 이미 선택된 `title` 기준으로 중복을 제거한다
- **지도 렌더링**: `NaverMap.tsx`가 NCP Maps SDK 스크립트를 런타임에 삽입(중복 삽입 방지 체크 포함)하고, `mapx`/`mapy`(정수 좌표)를 `/1e7`로 WGS84 위경도로 변환한다. `focusedIndex`가 있으면 해당 마커로 `panTo`+확대, 없으면 전체 마커 `fitBounds`
- **투표 제출**: `submitMyVote`는 먼저 `deleteVotesByVoter(roomId, voterName)`로 기존 투표를 지운 뒤 선택된 장소마다 `submitVote`를 순차 삽입 — 재투표가 "덮어쓰기"로 동작(멱등)
- **정렬/1위 판정**: `sortedPlaces`는 득표수 내림차순, `maxVotes`와 득표수가 같으면 모두 `isLeading`(동률 시 여러 곳에 👑 표시 가능)
- **멤버 칩 vs 자유 입력**: `memberNames.length > 0`이면 `VotingForm`이 칩 선택 UI로 전환되고, 이미 투표한 멤버는 체크 표시(`✓`)로 구분된다

## 6. 알려진 제약 / 후속 과제

- RPC/서버측 검증 없이 테이블 직접 CRUD — anon key 트레이드오프이지만 account-book·daily 대비 권한 검증 계층이 얕다
- 이 서비스만을 위한 `menu-details/place.md` 문서가 아직 없다
- `NaverMap.tsx`의 `window.naver: any` — SDK 타입 정의가 없어 `any`로 처리됨 (개선 백로그 P2-7 `services/schedule.ts` any 제거 범위 밖)
- slug-shortCode 라우팅을 place도 쓰고 있지만 [ADR-002](../adr/ADR-002-slug-shortcode-routing.md)는 meeting·calc만 명시 — ADR 갱신 여지
- rate limit이 인메모리 기반이라 서버리스 다중 인스턴스 환경에서 완벽하지 않음(주석으로 이미 인지된 트레이드오프)
