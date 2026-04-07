"use client";

import styled, { css } from "styled-components";

// ─────────────────────────────────────────────
// 🎨 Design Tokens
// ─────────────────────────────────────────────

export const abTokens = {
  color: {
    primary: "#5f73d9",
    primaryBorder: "#4e67d0",
    primaryHover: "#4b69c8",
    primaryLight: "#eef4ff",
    primaryLightEnd: "#e7efff",
    primaryBorderLight: "#b8ccf6",

    danger: "#c44d76",
    dangerBg: "#fff5f8",
    dangerBorder: "#f1c8d6",

    textDark: "#1f2937",
    textHeading: "#223147",
    textBody: "#334155",
    textMuted: "#66758b",
    textCaption: "#7a8799",
    textPlaceholder: "#8a99ad",

    borderDefault: "#dce5f0",
    borderLight: "#e5eaf0",
    borderInput: "#d5dfec",
    borderSection: "#ecf1f7",

    bgPage: "linear-gradient(180deg, #f6f8fc 0%, #edf2f8 100%)",
    bgCard: "#f9fbff",
    bgWhite: "#ffffff",
    bgModal: "rgba(255, 255, 255, 0.97)",
    bgBackdrop: "rgba(17, 24, 39, 0.2)",
    bgBackdropDark: "rgba(15, 23, 42, 0.34)",

    badgeBlue: { bg: "#eaf1ff", text: "#3657b5", border: "#8aa7fb" },
    badgeNeutral: { bg: "#f3f6fa", text: "#5d6e87", border: "#d9e4f1" },
  },

  radius: {
    sm: "10px",
    md: "12px",
    lg: "16px",
    xl: "18px",
    xxl: "24px",
    card: "26px",
    pill: "999px",
  },

  shadow: {
    modal: "0 24px 48px rgba(45, 62, 100, 0.14)",
    button: "0 8px 20px rgba(74, 103, 204, 0.14)",
    card: "0 1px 4px rgba(49, 67, 110, 0.06)",
  },

  breakpoint: {
    mobile: "720px",
    tablet: "900px",
    desktop: "1080px",
    wide: "1400px",
  },
} as const;

// ─────────────────────────────────────────────
// 📐 Media Queries
// ─────────────────────────────────────────────

export const media = {
  mobile: `@media (max-width: ${abTokens.breakpoint.mobile})`,
  tablet: `@media (max-width: ${abTokens.breakpoint.tablet})`,
  desktop: `@media (max-width: ${abTokens.breakpoint.desktop})`,
  wide: `@media (max-width: ${abTokens.breakpoint.wide})`,
} as const;

// ─────────────────────────────────────────────
// 🔘 Button Components
// ─────────────────────────────────────────────

const buttonBase = css`
  border-radius: ${abTokens.radius.lg};
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s ease;

  &:disabled {
    opacity: 0.52;
    cursor: not-allowed;
  }
`;

export const StAbPrimaryButton = styled.button`
  ${buttonBase}
  border: 1px solid ${abTokens.color.primaryBorder};
  background: ${abTokens.color.primary};
  color: #fff;
  padding: 0.82rem 1rem;
  font-size: 0.9rem;
  min-height: 3rem;
  box-shadow: ${abTokens.shadow.button};

  ${media.mobile} {
    width: 100%;
    padding: 0.76rem 0.9rem;
    font-size: 0.88rem;
  }
`;

export const StAbSecondaryButton = styled.button`
  ${buttonBase}
  border: 1px solid #cedbeb;
  background: rgba(255, 255, 255, 0.95);
  color: #506683;
  padding: 0.82rem 1rem;
  font-size: 0.9rem;
  min-height: 3rem;

  ${media.mobile} {
    width: 100%;
    padding: 0.76rem 0.9rem;
    font-size: 0.88rem;
  }
`;

export const StAbDangerButton = styled.button`
  ${buttonBase}
  border: 1px solid ${abTokens.color.dangerBorder};
  background: ${abTokens.color.dangerBg};
  color: ${abTokens.color.danger};
  padding: 0.75rem 0.9rem;
  font-size: 0.84rem;
`;

export const StAbApplyButton = styled.button`
  ${buttonBase}
  border: none;
  background: linear-gradient(135deg, #607de0, ${abTokens.color.primaryHover});
  color: #fff;
  padding: 0.75rem 0.9rem;
  font-size: 0.84rem;
`;

// ─────────────────────────────────────────────
// 🃏 Selection Option (Toggle Buttons)
// ─────────────────────────────────────────────

export const StAbSelectOption = styled.button<{ $active: boolean }>`
  border: 1px solid
    ${({ $active }) =>
      $active ? abTokens.color.primaryBorderLight : "#dce3eb"};
  background: ${({ $active }) =>
    $active
      ? `linear-gradient(180deg, ${abTokens.color.primaryLight} 0%, ${abTokens.color.primaryLightEnd} 100%)`
      : "#fff"};
  color: ${({ $active }) => ($active ? "#355cb1" : "#5b6475")};
  border-radius: ${abTokens.radius.md};
  padding: 0.66rem 0.55rem;
  font-size: 0.82rem;
  font-weight: 700;

  ${media.mobile} {
    min-height: 38px;
    padding: 0.5rem 0.4rem;
    font-size: 0.76rem;
  }
`;

export const StAbPillOption = styled.button<{ $active: boolean }>`
  border: 1px solid
    ${({ $active }) =>
      $active ? abTokens.color.primaryBorderLight : "#dce3eb"};
  background: ${({ $active }) =>
    $active
      ? `linear-gradient(180deg, ${abTokens.color.primaryLight} 0%, ${abTokens.color.primaryLightEnd} 100%)`
      : "#fff"};
  color: ${({ $active }) => ($active ? "#355cb1" : "#5b6475")};
  border-radius: ${abTokens.radius.pill};
  padding: 0.38rem 0.68rem;
  font-size: 0.76rem;
  font-weight: 700;

  ${media.mobile} {
    flex-shrink: 0;
    padding: 0.38rem 0.62rem;
    font-size: 0.72rem;
  }
`;

// ─────────────────────────────────────────────
// 📝 Input Components
// ─────────────────────────────────────────────

export const abInputBase = css`
  width: 100%;
  min-height: 40px;
  border: 1px solid #dce3eb;
  border-radius: ${abTokens.radius.sm};
  padding: 0.62rem 0.7rem;
  font-size: 0.9rem;
  background: #fff;
  color: #111827;

  &:focus {
    outline: none;
    border-color: #6fa6c9;
    box-shadow: 0 0 0 3px rgba(111, 166, 201, 0.15);
  }
`;

export const StAbInput = styled.input`
  ${abInputBase}

  ${media.mobile} {
    padding: 0.56rem 0.65rem;
    font-size: 0.88rem;
  }
`;

export const StAbTextarea = styled.textarea`
  ${abInputBase}
  min-height: 92px;
  resize: vertical;

  ${media.mobile} {
    min-height: 72px;
    padding: 0.56rem 0.65rem;
    font-size: 0.86rem;
  }
`;

export const StAbSettingsInput = styled.input`
  width: 100%;
  border: 1px solid #d5deea;
  border-radius: ${abTokens.radius.md};
  background: #fff;
  padding: 0.75rem 0.85rem;
  font-size: 0.86rem;
  color: ${abTokens.color.textDark};
`;

// ─────────────────────────────────────────────
// 🏷️ Badge / Chip Components
// ─────────────────────────────────────────────

export const StAbBadge = styled.span<{
  $tone?: "blue" | "neutral" | "purple" | "teal" | "danger";
}>`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  border-radius: ${abTokens.radius.pill};
  font-size: 0.72rem;
  font-weight: 900;
  padding: 0.28rem 0.55rem;

  ${({ $tone = "blue" }) => {
    const tones = {
      blue: css`
        background: #eaf1ff;
        color: #3657b5;
      `,
      neutral: css`
        background: #f3f6fa;
        color: #5d6e87;
      `,
      purple: css`
        background: #f2f0ff;
        color: #6b63e8;
      `,
      teal: css`
        background: #eef8f7;
        color: #3f8f8a;
      `,
      danger: css`
        background: ${abTokens.color.dangerBg};
        color: ${abTokens.color.danger};
      `,
    };
    return tones[$tone];
  }}
`;

export const StAbChip = styled.button<{ $active: boolean }>`
  border: 1px solid
    ${({ $active }) =>
      $active
        ? abTokens.color.badgeBlue.border
        : abTokens.color.badgeNeutral.border};
  background: ${({ $active }) =>
    $active
      ? abTokens.color.badgeBlue.bg
      : "#fff"};
  color: ${({ $active }) =>
    $active
      ? abTokens.color.badgeBlue.text
      : abTokens.color.textMuted};
  border-radius: ${abTokens.radius.pill};
  padding: 0.35rem 0.65rem;
  font-size: 0.76rem;
  font-weight: 800;
`;

// ─────────────────────────────────────────────
// 🖼️ Modal Components
// ─────────────────────────────────────────────

export const StAbModalBackdrop = styled.div<{
  $align?: "center" | "end" | "stretch";
}>`
  position: fixed;
  inset: 0;
  background: ${abTokens.color.bgBackdrop};
  backdrop-filter: blur(4px);
  display: flex;
  align-items: ${({ $align = "center" }) =>
    $align === "end" ? "flex-end" : $align === "stretch" ? "stretch" : "center"};
  justify-content: center;
  padding: 1rem;
  z-index: 121;

  ${media.mobile} {
    align-items: ${({ $align }) =>
      $align === "stretch" ? "stretch" : "flex-end"};
    padding: ${({ $align }) => ($align === "stretch" ? "0" : "0.75rem")};
  }
`;

export const StAbModalCard = styled.div<{ $width?: string }>`
  width: min(${({ $width = "660px" }) => $width}, 100%);
  max-height: min(84vh, 920px);
  overflow: auto;
  border: 1px solid #d9e3ef;
  border-radius: ${abTokens.radius.card};
  background: ${abTokens.color.bgWhite};
  padding: 1.6rem 1.2rem 1.05rem;
  box-shadow: ${abTokens.shadow.modal};

  ${media.mobile} {
    width: 100%;
    max-height: min(92vh, 920px);
    padding: 1.2rem 0.9rem calc(0.95rem + env(safe-area-inset-bottom));
    border-radius: 28px 28px 22px 22px;
  }
`;

export const StAbModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
`;

export const StAbModalTitleBlock = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.4rem;
`;

export const StAbModalTitle = styled.h3`
  font-size: 1.55rem;
  line-height: 1.15;
  font-weight: 900;
  color: ${abTokens.color.textDark};

  ${media.mobile} {
    font-size: 1.35rem;
  }
`;

export const StAbModalDescription = styled.p`
  max-width: 38rem;
  font-size: 0.88rem;
  line-height: 1.5;
  color: #617186;

  ${media.mobile} {
    font-size: 0.84rem;
    line-height: 1.45;
  }
`;

// ─────────────────────────────────────────────
// 📋 Section Header Components
// ─────────────────────────────────────────────

export const StAbSectionHeader = styled.div`
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;

  ${media.mobile} {
    margin-bottom: 0.68rem;
    padding-bottom: 0.48rem;
    border-bottom: 1px solid ${abTokens.color.borderSection};
  }
`;

export const StAbSectionTitle = styled.h4`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 900;
  line-height: 1.2;
  color: ${abTokens.color.textHeading};

  ${media.mobile} {
    font-size: 0.92rem;
  }
`;

export const StAbSectionDescription = styled.p`
  margin: 0.22rem 0 0;
  font-size: 0.78rem;
  line-height: 1.45;
  color: ${abTokens.color.textCaption};

  ${media.mobile} {
    display: none;
  }
`;

// ─────────────────────────────────────────────
// 📊 Progress Bar Components
// ─────────────────────────────────────────────

export const StAbProgressBar = styled.div<{ $height?: string }>`
  width: 100%;
  height: ${({ $height = "0.52rem" }) => $height};
  background: #edf1f5;
  border-radius: ${abTokens.radius.pill};
  overflow: hidden;
`;

export const StAbProgressFill = styled.div<{
  $ratio: number;
  $color?: string;
}>`
  height: 100%;
  width: ${({ $ratio }) => `${Math.min(Math.max(Math.round($ratio * 10000) / 100, 0), 100)}%`};
  background: ${({ $color = abTokens.color.primary }) => $color};
  border-radius: inherit;
  transition: width 0.3s ease;
`;

// ─────────────────────────────────────────────
// 🏗️ Card & Layout Components
// ─────────────────────────────────────────────

export const StAbCard = styled.div`
  border: 1px solid ${abTokens.color.borderDefault};
  border-radius: ${abTokens.radius.xl};
  background: ${abTokens.color.bgCard};
  padding: 0.85rem;
  display: grid;
  gap: 0.55rem;
`;

export const StAbCardGrid = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: repeat(
    ${({ $columns = 2 }) => $columns},
    minmax(0, 1fr)
  );
  gap: 0.8rem;

  ${media.tablet} {
    grid-template-columns: 1fr;
  }
`;

export const StAbFormRow = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: ${({ $columns = 2 }) =>
    `repeat(${$columns}, minmax(0, 1fr))`};
  gap: 0.65rem;

  ${media.mobile} {
    grid-template-columns: 1fr;
    gap: 0.45rem;
  }
`;

export const StAbButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

// ─────────────────────────────────────────────
// 📄 Loading States
// ─────────────────────────────────────────────

export const StAbLoadingPage = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: ${abTokens.color.bgPage};
  padding: 1rem;
`;

export const StAbLoadingCard = styled.section`
  width: min(100%, 18rem);
  border-radius: ${abTokens.radius.xxl};
  border: 1px solid #d7e2ef;
  background: rgba(255, 255, 255, 0.94);
  color: #4f6077;
  font-size: 0.95rem;
  font-weight: 800;
  padding: 1.2rem 1.3rem;
  text-align: center;
`;

// ─────────────────────────────────────────────
// 🏷️ Form Label Components
// ─────────────────────────────────────────────

export const StAbLabel = styled.label`
  display: block;
  margin-bottom: 0.38rem;
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 700;

  ${media.mobile} {
    margin-bottom: 0.4rem;
    font-size: 0.72rem;
    color: #556274;
  }
`;

export const StAbSubLabel = styled.label`
  display: block;
  margin: 0.65rem 0 0.3rem;
  font-size: 0.72rem;
  color: #6b7280;
  font-weight: 700;
`;

// ─────────────────────────────────────────────
// 📐 Section Card (for form sections)
// ─────────────────────────────────────────────

export const StAbSectionCard = styled.section`
  padding: 1.05rem 0 1rem;

  & + & {
    border-top: 1px solid ${abTokens.color.borderSection};
  }

  ${media.mobile} {
    padding: 0.9rem 0.9rem 1rem;

    & + & {
      border-top: 1px solid ${abTokens.color.borderSection};
    }
  }
`;

// ─────────────────────────────────────────────
// 🔄 Footer Action Bar
// ─────────────────────────────────────────────

export const StAbFooterActionBar = styled.div`
  padding: 0.45rem 1rem calc(1rem + env(safe-area-inset-bottom));
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.94) 0%,
    rgba(255, 255, 255, 0.98) 100%
  );
  border-top: 1px solid #e5ecf5;

  ${media.mobile} {
    padding: 0.6rem 0.74rem calc(1rem + env(safe-area-inset-bottom));
  }
`;
