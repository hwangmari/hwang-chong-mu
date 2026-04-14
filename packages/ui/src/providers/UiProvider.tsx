"use client";

import React from "react";
import { ThemeProvider } from "styled-components";
import { GlobalStyle } from "../global-style";
import { darkTheme, lightTheme, type ThemeMode } from "../theme";

interface UiProviderProps {
  children: React.ReactNode;
  mode?: ThemeMode;
}

export function UiProvider({ children, mode = "light" }: UiProviderProps) {
  const theme = mode === "dark" ? darkTheme : lightTheme;
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  );
}
