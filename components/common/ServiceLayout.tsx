"use client";

import { ComponentProps, ReactNode } from "react";
import PageIntro from "@/components/common/PageIntro";
import FooterGuide from "@/components/common/FooterGuide";
import {
  PAGE_WIDTHS,
  StContainer,
  StFlexBox,
  StPageWrapper,
  StToolColumn,
  type PageWidth,
} from "@/components/styled/layout.styled";

/**
 * 서비스 페이지 한 장의 뼈대.
 *
 * 예전에는 페이지마다 `StPageWrapper $width` → `PageIntro align` → `StToolColumn`
 * → `FooterGuide layout` 을 손으로 맞춰 끼웠다. 세 곳의 값이 서로 어긋나면
 * 화면마다 제목 정렬이나 팁 카드 열 수가 달라졌다.
 *
 * 이제 페이지는 `width` 하나만 고르면 되고, 나머지는 아래 LAYOUT_RULES 가 정한다.
 */

interface LayoutRule {
  /** 데스크톱에서의 본문 최대 폭 */
  maxWidth: string;
  /** PageIntro 정렬 */
  introAlign: NonNullable<ComponentProps<typeof PageIntro>["align"]>;
  /** FooterGuide 팁 카드 그리드 */
  guideLayout: NonNullable<ComponentProps<typeof FooterGuide>["layout"]>;
  /** 옆 칸(side)을 둘 수 있는 폭인지 */
  allowSide: boolean;
  /** 이 폭을 언제 쓰는지 — /ui-kit 등에서 그대로 보여주기 위한 한 줄 설명 */
  description: string;
}

/**
 * 폭 하나가 정하는 것들. 표를 고치면 전 페이지가 함께 따라온다.
 *
 * | width  | 본문 폭 | 제목 정렬 | 팁 카드 | 옆 칸 |
 * |--------|--------|----------|--------|------|
 * | narrow | 560px  | 가운데    | 1열     | 불가 |
 * | tool   | 760px  | 왼쪽      | 2열     | 불가 |
 * | wide   | 1025px | 왼쪽      | 3열     | 가능 |
 *
 * 팁 카드 열 수는 FooterGuide 가 컨테이너 폭으로 스스로 정한다.
 * 여기서는 "본문 폭을 따라가라(full)" / "무조건 한 줄씩(compact)" 만 고른다.
 */
export const LAYOUT_RULES = {
  narrow: {
    maxWidth: PAGE_WIDTHS.narrow,
    introAlign: "center",
    guideLayout: "compact",
    allowSide: false,
    description: "입력 필드 몇 개짜리 폼 — 제목도 가운데로 모은다",
  },
  tool: {
    maxWidth: PAGE_WIDTHS.tool,
    introAlign: "left",
    guideLayout: "full",
    allowSide: false,
    description: "계산기처럼 조밀한 도구 — 표·결과가 들어갈 만큼은 넓게",
  },
  wide: {
    maxWidth: PAGE_WIDTHS.wide,
    introAlign: "left",
    guideLayout: "full",
    allowSide: true,
    description: "목록·지도·검색결과처럼 옆에 둘 내용이 진짜 있는 화면",
  },
} as const satisfies Record<PageWidth, LayoutRule>;

/** 정렬은 폭이 정하므로 페이지가 따로 넘기지 않는다 */
type IntroConfig = Omit<ComponentProps<typeof PageIntro>, "align">;
/** 팁 카드 열 수도 폭이 정한다 */
type GuideConfig = Omit<ComponentProps<typeof FooterGuide>, "layout">;

interface ServiceLayoutProps {
  /** 이 화면의 성격. 폭·제목 정렬·팁 카드 열 수가 여기서 갈린다. */
  width: PageWidth;
  /** 상단 소개 (아이콘·제목·설명). 약관처럼 소개가 없으면 생략한다. */
  intro?: IntroConfig;
  /** 하단 사용 가이드. 가이드가 없는 화면이면 생략한다. */
  guide?: GuideConfig;
  /** 데스크톱에서 오른쪽에 세울 칸. `width="wide"` 일 때만 쓰인다. */
  side?: ReactNode;
  /**
   * 두 칸일 때 왼쪽(본문) 칸의 flex 비율. 기본 1 = 반반.
   * StFlexBox 의 `$leftRatio` 로 그대로 넘어간다.
   */
  mainRatio?: number;
  /** 두 칸일 때 왼쪽(본문) 칸을 스크롤에 따라오게 붙인다. */
  sticky?: boolean;
  /** 본문 — 폼이나 도구 */
  children: ReactNode;
}

export default function ServiceLayout({
  width,
  intro,
  guide,
  side,
  mainRatio,
  sticky,
  children,
}: ServiceLayoutProps) {
  const rule = LAYOUT_RULES[width];
  const twoColumn = Boolean(side) && rule.allowSide;

  if (process.env.NODE_ENV !== "production" && side && !rule.allowSide) {
    console.warn(
      `[ServiceLayout] width="${width}" 는 한 칸짜리 화면이라 side 를 그리지 않습니다. ` +
        `옆 칸이 필요하면 width="wide" 로 두세요.`,
    );
  }

  return (
    <StContainer>
      <StPageWrapper $width={width}>
        {intro && <PageIntro {...intro} align={rule.introAlign} />}

        {twoColumn ? (
          <StFlexBox $leftRatio={mainRatio} $sticky={sticky}>
            <div className="flex-lft-box">{children}</div>
            <div className="flex-rgt-box">{side}</div>
          </StFlexBox>
        ) : (
          <StToolColumn>{children}</StToolColumn>
        )}

        {guide && <FooterGuide {...guide} layout={rule.guideLayout} />}
      </StPageWrapper>
    </StContainer>
  );
}
