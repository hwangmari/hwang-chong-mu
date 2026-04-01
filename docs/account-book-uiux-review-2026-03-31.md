# 가계부 UIUX 검토

- 검토일: 2026-03-31
- 범위: 허브, 워크스페이스 헤더, 리스트/캘린더/보드, 등록 모달, 우측 상세 패널
- 기준: "직접 사용해도 되는가", "실사용 중 어디서 피로감이 생기는가", "다음 수정 우선순위는 무엇인가"

## 총평

현재 상태는 **개인 사용 + 소규모 공유용 베타**로는 충분히 사용할 수 있습니다.  
특히 `개인 -> 공용방 확장`, `리스트 / 캘린더 / 보드` 역할 분리, `연간 흐름 + 월별 흐름` 구조는 방향이 좋습니다.

다만 **지금 바로 외부 사용자에게 열어도 되는 완성형**은 아닙니다.  
가장 먼저 보이는 리스크는 다음 3가지입니다.

1. 모달과 팝오버의 키보드 접근성 부족
2. 일부 화면의 읽기 밀도 과다 또는 빈 줄 노이즈
3. 캘린더와 상단 요약 카드의 정보 강조 방식이 아직 덜 정돈됨

정리하면:

- 내부 실사용: 가능
- 지인/소규모 테스트: 가능
- 공개 서비스 수준: 1차 UX 안정화 후 권장

## 잘 된 점

### 1. 화면 역할 분리가 점점 명확해짐

- `리스트`: 토탈 정보 + 사용 흐름
- `캘린더`: 날짜 기준 확인
- `보드`: 월간/연간 흐름 확인

이 구조는 실제 사용 문맥과 잘 맞습니다. 사용자가 "지금 입력한다 / 오늘 본다 / 월 흐름을 본다"를 쉽게 구분할 수 있습니다.

### 2. 개인과 공용의 관계가 이해되기 쉬워짐

- 개인 가계부를 원본 기록 공간으로 두고
- 필요한 항목만 공용방으로 연결하는 흐름이 꽤 자연스럽습니다.

허브 문구와 카드 구조도 예전보다 훨씬 부드럽고 이해하기 쉬워졌습니다.

### 3. 월 이동과 보드 흐름이 좋아짐

- 헤더의 월 이동
- 보드의 연간 테이블
- 리스트/캘린더의 월별 탐색

이 세 축이 연결되면서 "이번 달 체크 -> 다른 달 이동 -> 연간 비교" 흐름이 생겼습니다.

## 우선 수정이 필요한 이슈

### P1. 모달과 월 선택 팝오버의 접근성/조작 안정성이 부족함

현재 모달과 팝오버는 시각적으로는 잘 보이지만, `role="dialog"`, 포커스 트랩, `Escape` 닫기, 키보드 이동 같은 기본 안전장치가 없습니다. 키보드 사용자나 빠르게 입력하는 사용자 입장에서는 컨텍스트를 잃기 쉽고, 모바일/데스크톱 모두에서 "닫힘/열림 상태"가 불안정하게 느껴질 수 있습니다.

- 관련 코드:
  - [/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/WorkspaceHeader.tsx#L56](/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/WorkspaceHeader.tsx#L56)
  - [/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/WorkspaceHeader.tsx#L121](/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/WorkspaceHeader.tsx#L121)
  - [/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/EntryFormModal.tsx#L95](/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/EntryFormModal.tsx#L95)
  - [/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/WorkspaceHub.tsx#L390](/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/WorkspaceHub.tsx#L390)

권장 방향:

- 공통 `dialog shell` 도입
- `Escape` 닫기
- 첫 포커스와 마지막 포커스 순환 처리
- 월 선택 팝오버에도 `aria-expanded`, `aria-controls`, 방향키 이동 추가

### P1. 상세 내역 카드가 빈 줄을 계속 만들어 읽기 밀도를 해침

상세 패널에서 메모가 비어 있어도 메모 영역을 항상 렌더링하고 있습니다. 내역이 많은 달에는 한 카드당 세로 여백이 불필요하게 늘어나고, 실제로 중요한 정보인 금액/항목/가맹점보다 빈 공간이 더 크게 느껴질 수 있습니다.

- 관련 코드:
  - [/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/DetailEntriesPanel.tsx#L88](/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/DetailEntriesPanel.tsx#L88)
  - [/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/DetailEntriesPanel.tsx#L90](/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/DetailEntriesPanel.tsx#L90)

권장 방향:

- `memo`가 있을 때만 메모 줄 노출
- `merchant`, `item`, `memo` 우선순위 재정렬
- 우측 상세 패널은 한 화면에 더 많은 행이 보이도록 세로 압축

### P2. 캘린더 셀의 가독성이 아직 약함

캘린더 셀은 구조는 깔끔하지만, 금액 텍스트가 `0.65rem`으로 작고 수입/지출 구분이 색상 의존적입니다. 실제 데이터가 많은 달이나 노트북 화면에서는 "어디에 돈이 몰렸는지" 빠르게 스캔하기 어렵습니다.

- 관련 코드:
  - [/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/CalendarPanel.tsx#L85](/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/CalendarPanel.tsx#L85)
  - [/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/CalendarPanel.tsx#L109](/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/CalendarPanel.tsx#L109)

권장 방향:

- 날짜 숫자와 금액 대비를 더 분명하게 분리
- 금액을 1줄만 보여주거나, `순지출 우선` 방식으로 단순화
- 주말 색/선택 색/비활성 월 색을 더 체계적으로 정리

### P2. 상단 요약 카드가 여전히 세로 공간을 많이 차지함

리스트와 캘린더 상단 카드가 예전보다 좋아졌지만, 카드 높이가 아직 큰 편입니다. 노트북 높이에서는 하단 핵심 영역이 접히기 쉬워서 "요약은 보이는데 정작 내역은 덜 보이는" 느낌이 남아 있습니다.

- 관련 코드:
  - [/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/TopSummaryControls.tsx#L122](/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/TopSummaryControls.tsx#L122)
  - [/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/TopSummaryControls.tsx#L193](/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/TopSummaryControls.tsx#L193)

권장 방향:

- 캘린더 카드: 높이 축소, 보조 텍스트 2줄 이하
- 리스트 카드: 라벨/금액/건수만 남기고 설명은 최소화
- "상단 요약"이 아니라 "상단 상태 바"처럼 느껴지게 밀도 조정

### P2. 허브 카드 정보가 여전히 조금 많음

허브는 많이 좋아졌지만, 섹션 설명 + 카드 본문 + 오른쪽 요약 설명이 겹치면서 한 번에 읽어야 하는 문장이 아직 많습니다. 기능 이해는 잘 되지만, 첫 방문자는 "어디를 눌러야 하는지"보다 "읽어야 할 텍스트"가 먼저 보일 수 있습니다.

- 관련 코드:
  - [/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/WorkspaceHub.tsx#L273](/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/WorkspaceHub.tsx#L273)
  - [/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/WorkspaceHub.tsx#L315](/Users/hwangmari/toy-project/hwang-chong-mu/app/account-book/components/WorkspaceHub.tsx#L315)

권장 방향:

- 카드 안 설명은 1문장으로 축소
- 오른쪽 요약 영역은 숫자/태그 중심으로 간소화
- 섹션 설명은 없는 상태일 때만 강하게 보이게 조정

## 실사용 관점 판정

### 지금 바로 써도 되는가?

네, **직접 사용하는 수준에서는 충분히 사용 가능합니다.**

특히 아래 용도에는 이미 괜찮습니다.

- 개인 생활비 기록
- 부부/소규모 공용방 기록
- 월별 수입/지출/저축 흐름 확인
- 공용방과 개인방 나눠 쓰는 습관 형성

### 아직 불안한 지점은?

아래는 실제로 오래 쓸수록 피로가 쌓일 영역입니다.

- 키보드로 빠르게 조작할 때
- 내역이 많은 달을 캘린더/상세 패널에서 볼 때
- 모바일 또는 작은 노트북 화면에서 스크롤 깊이가 길어질 때
- 모달과 팝오버를 자주 여닫을 때

## 추천 작업 순서

### 1차

- 공통 모달/팝오버 접근성 정리
- 상세 내역 카드 빈 줄 제거
- 캘린더 숫자/금액 가독성 개선

### 2차

- 상단 요약 카드 높이 추가 압축
- 허브 카드 설명 축소
- 저장/수정/공유 액션에 작은 피드백 토스트 추가

### 3차

- 모바일 레이아웃 별도 다듬기
- 키보드 중심 사용 시나리오 점검
- 공용방 협업 UX 세부화

## 한 줄 결론

현재 가계부는 **"구조는 잘 잡혔고, 실제로 써볼 수 있는 단계"** 입니다.  
다만 완성도를 확 끌어올리려면, 이제부터는 새 화면 추가보다 **읽기 밀도와 조작 안정성**을 다듬는 쪽이 더 효과적입니다.
