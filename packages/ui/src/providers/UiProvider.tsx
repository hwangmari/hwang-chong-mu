"use client";

import React from "react";
import { ThemeProvider } from "styled-components";
import { GlobalStyle } from "../global-style";
import { uiTheme } from "../theme";

interface UiProviderProps {
  children: React.ReactNode;
}

export function UiProvider({ children }: UiProviderProps) {
  return (
    <ThemeProvider theme={uiTheme}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  );
}
