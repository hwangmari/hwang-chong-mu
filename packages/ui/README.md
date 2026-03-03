# @hwangchongmu/ui

황총무 앱과 분리해서 재사용할 수 있는 공용 UI 패키지입니다.

## 포함 범위

- 디자인 토큰(`uiTheme`)
- 스타일 주입용 Provider(`UiProvider`)
- 기본 컴포넌트(`Button`, `Input`, `Typography`)

## 로컬 사용 예시

```tsx
import { Button, Input, Typography } from "@hwangchongmu/ui";
```

```tsx
import { UiProvider } from "@hwangchongmu/ui";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <UiProvider>{children}</UiProvider>;
}
```

## 다음 단계

- `Badge`, `Card`, `Modal`, `Tabs` 같은 조합형 컴포넌트 추가
- Storybook 또는 전용 docs 앱 추가
- npm publish 가능하도록 build 설정 분리
