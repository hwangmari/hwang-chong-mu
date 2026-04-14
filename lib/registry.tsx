"use client"; // 👈 [필수] 이게 없으면 에러가 납니다!

import React, { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";
import { UiProvider } from "@hwangchongmu/ui";
import { ThemeModeProvider, useThemeMode } from "./themeMode";

function ThemedUiProvider({ children }: { children: React.ReactNode }) {
  const { mode } = useThemeMode();
  return <UiProvider mode={mode}>{children}</UiProvider>;
}

export default function StyledComponentsRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement();
    styledComponentsStyleSheet.instance.clearTag();
    return <>{styles}</>;
  });

  if (typeof window !== "undefined") {
    return (
      <ThemeModeProvider>
        <ThemedUiProvider>{children}</ThemedUiProvider>
      </ThemeModeProvider>
    );
  }

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
      <ThemeModeProvider>
        <ThemedUiProvider>{children}</ThemedUiProvider>
      </ThemeModeProvider>
    </StyleSheetManager>
  );
}
