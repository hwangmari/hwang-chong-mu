"use client";

import Link from "next/link";
import styled from "styled-components";

/**
 * 황총무 디자인 시스템 · 컴포넌트 라이브러리
 *
 * 페이지 크롬(배경·텍스트·패널·라인·목차)은 앱 테마 토큰을 사용해
 * light/dark 테마에 자동 대응합니다.
 * 컴포넌트 스펙(specimen)은 실제 제품 컴포넌트의 고정 색(product)을 그대로 재현합니다.
 */

// 실제 제품 컴포넌트에서 쓰는 고정 색 (테마와 무관하게 제품의 실제 룩을 재현)
const product = {
  blue50: "#eaf1fe",
  blue600: "#2f6bdd",
  primary: "#3182f6",
  indigo500: "#5b57e0",
  gray100: "#eef0f2",
  gray200: "#e2e3e5",
  gray400: "#9aa0a8",
  gray500: "#767c86",
  gray800: "#2b3038",
  gray900: "#191d22",
  amber50: "#fdf1dd",
  amber500: "#f0a92a",
  amber600: "#a9700a",
  green50: "#e2f5e6",
  green600: "#2f8a4a",
  teal50: "#dcf3f0",
  teal600: "#12867a",
  indigo50: "#e8e7fb",
  indigo600: "#5049c9",
  rose50: "#fce4ea",
  rose500: "#fb7185",
  rose600: "#c23b62",
  danger: "#e11d48",
  grad: "linear-gradient(135deg,#3b5bdb,#5a58df)",
  gradDeep: "linear-gradient(135deg,#4740c0,#2f4bc4)",
};

const toc = [
  {
    group: "Foundations",
    items: [
      { href: "#color", label: "색상 토큰" },
      { href: "#type", label: "타이포그래피" },
      { href: "#shape", label: "라운드 · 그라데이션" },
    ],
  },
  {
    group: "Components",
    items: [
      { href: "#button", label: "버튼" },
      { href: "#input", label: "입력" },
      { href: "#chip", label: "칩 · 배지" },
      { href: "#widget", label: "요약 위젯" },
      { href: "#board", label: "보드" },
      { href: "#tabs", label: "아이콘 탭" },
      { href: "#budget", label: "예산 바" },
      { href: "#calendar", label: "캘린더 셀" },
    ],
  },
];

const semanticSwatches = [
  { color: product.primary, name: "primary", desc: "blue · 버튼·강조" },
  { color: product.danger, name: "danger", desc: "rose · 초과·삭제" },
  { color: product.teal600, name: "success", desc: "teal · 달성" },
  { color: product.amber500, name: "warning", desc: "amber · 예산" },
  { color: product.gray900, name: "text", desc: "gray900" },
  { color: product.gray500, name: "subText", desc: "gray500" },
];

const tintSwatches = [
  { color: product.amber50, name: "가계부", desc: "amber" },
  { color: product.green50, name: "다이어트", desc: "green" },
  { color: product.teal50, name: "습관", desc: "teal" },
  { color: product.blue50, name: "운동", desc: "blue" },
  { color: product.indigo50, name: "약속", desc: "indigo" },
  { color: product.rose50, name: "정산", desc: "rose" },
];

export default function UiKitPage() {
  return (
    <>
      <Masthead>
        <Wrap>
          <MastRow>
            <Brand>
              <BrandMark>🐰</BrandMark>
              <div>
                <BrandTitle>황총무 디자인 시스템</BrandTitle>
                <BrandSub>컴포넌트 라이브러리 · styled-components + 시맨틱 토큰</BrandSub>
              </div>
            </Brand>
            <MastMeta>
              <BackLink href="/">← 홈으로</BackLink>
              <MetaText className="mono">
                v1 · 2026-08
                <br />
                <b>실제 제품 컴포넌트</b> 스펙
              </MetaText>
            </MastMeta>
          </MastRow>
        </Wrap>
      </Masthead>

      <Wrap>
        <Shell>
          <Toc>
            {toc.map((section) => (
              <div key={section.group}>
                <TocGroup>{section.group}</TocGroup>
                {section.items.map((item) => (
                  <TocLink key={item.href} href={item.href}>
                    {item.label}
                  </TocLink>
                ))}
              </div>
            ))}
          </Toc>

          <Main>
            {/* COLOR */}
            <Block id="color">
              <BlockHead>
                <BlockTag className="mono">Foundations</BlockTag>
                <BlockTitle>색상 토큰</BlockTitle>
              </BlockHead>
              <Desc>
                시맨틱 토큰(primary·danger·success…)과, 서비스 구분용 틴트 6종. oklch
                팔레트에서 매핑돼요.
              </Desc>
              <SwatchGrid>
                {semanticSwatches.map((sw) => (
                  <Swatch key={sw.name}>
                    <SwatchChip style={{ background: sw.color }} />
                    <SwatchMeta>
                      <b>{sw.name}</b>
                      <span>{sw.desc}</span>
                    </SwatchMeta>
                  </Swatch>
                ))}
              </SwatchGrid>
              <Note className="mono">SERVICE TINTS</Note>
              <SwatchGrid>
                {tintSwatches.map((sw) => (
                  <Swatch key={sw.name}>
                    <SwatchChip style={{ background: sw.color }} />
                    <SwatchMeta>
                      <b>{sw.name}</b>
                      <span>{sw.desc}</span>
                    </SwatchMeta>
                  </Swatch>
                ))}
              </SwatchGrid>
            </Block>

            {/* TYPE */}
            <Block id="type">
              <BlockHead>
                <BlockTag className="mono">Foundations</BlockTag>
                <BlockTitle>타이포그래피</BlockTitle>
              </BlockHead>
              <Desc>
                시스템 한글 산세리프 기반. 굵기·크기·색으로 위계를 만들어요.
                (데이터·라벨엔 tabular-nums 모노)
              </Desc>
              <SpecFull>
                <Stage>
                  <TypeRow>
                    <TypeSpec>
                      <TypeLabel>Display</TypeLabel>
                      <span style={{ fontSize: "1.875rem", fontWeight: 900, letterSpacing: "-.02em" }}>
                        황총무의 실험실
                      </span>
                    </TypeSpec>
                    <TypeSpec>
                      <TypeLabel>Title</TypeLabel>
                      <span style={{ fontSize: "1.2rem", fontWeight: 900 }}>
                        오늘 지출 15,500원
                      </span>
                    </TypeSpec>
                    <TypeSpec>
                      <TypeLabel>Body</TypeLabel>
                      <span style={{ fontSize: ".95rem" }}>복잡한 건 제가 할게요, 총총총</span>
                    </TypeSpec>
                    <TypeSpec>
                      <TypeLabel>Label</TypeLabel>
                      <MutedMono
                        style={{
                          fontSize: ".72rem",
                          letterSpacing: ".14em",
                          textTransform: "uppercase",
                        }}
                      >
                        Experiment · 통합 계정
                      </MutedMono>
                    </TypeSpec>
                  </TypeRow>
                </Stage>
              </SpecFull>
            </Block>

            {/* SHAPE */}
            <Block id="shape">
              <BlockHead>
                <BlockTag className="mono">Foundations</BlockTag>
                <BlockTitle>라운드 · 그라데이션</BlockTitle>
              </BlockHead>
              <Desc>
                부드러운 큰 라운드가 브랜드 시그니처. 칩은 완전 알약(999px), 카드
                1.25–1.75rem. 히어로·보드엔 블루→인디고 그라데이션.
              </Desc>
              <Specimens>
                <Spec>
                  <Stage>
                    <ShapeBox style={{ borderRadius: ".8rem" }} />
                  </Stage>
                  <Cap>
                    <b>0.8rem</b>
                    <span>아이콘 박스</span>
                  </Cap>
                </Spec>
                <Spec>
                  <Stage>
                    <ShapeBox style={{ borderRadius: "1.25rem" }} />
                  </Stage>
                  <Cap>
                    <b>1.25rem</b>
                    <span>위젯 카드</span>
                  </Cap>
                </Spec>
                <Spec>
                  <Stage>
                    <ShapeBox style={{ borderRadius: "1.75rem" }} />
                  </Stage>
                  <Cap>
                    <b>1.75rem</b>
                    <span>보드</span>
                  </Cap>
                </Spec>
                <Spec>
                  <Stage>
                    <div
                      style={{
                        width: 100,
                        height: 40,
                        background: product.grad,
                        borderRadius: 999,
                      }}
                    />
                  </Stage>
                  <Cap>
                    <b>grad</b>
                    <span>blue → indigo</span>
                  </Cap>
                </Spec>
              </Specimens>
            </Block>

            {/* BUTTON */}
            <Block id="button">
              <BlockHead>
                <BlockTag className="mono">Components</BlockTag>
                <BlockTitle>버튼</BlockTitle>
              </BlockHead>
              <Desc>채움(주요 액션)·고스트(보조)·텍스트(경량)·알약 세그먼트(뷰 전환).</Desc>
              <Specimens>
                <Spec>
                  <Stage>
                    <BtnPrimary>로그인</BtnPrimary>
                  </Stage>
                  <Cap>
                    <b>Primary</b>
                    <span>주요 액션</span>
                  </Cap>
                </Spec>
                <Spec>
                  <Stage>
                    <BtnGhost>연결 해제</BtnGhost>
                  </Stage>
                  <Cap>
                    <b>Ghost</b>
                    <span>보조</span>
                  </Cap>
                </Spec>
                <Spec>
                  <Stage>
                    <BtnText>비밀번호를 잊으셨나요?</BtnText>
                  </Stage>
                  <Cap>
                    <b>Text</b>
                    <span>경량 링크</span>
                  </Cap>
                </Spec>
                <Spec>
                  <Stage>
                    <PillGroup>
                      <PillButton className="on">로그인</PillButton>
                      <PillButton>회원가입</PillButton>
                    </PillGroup>
                  </Stage>
                  <Cap>
                    <b>Pill Tabs</b>
                    <span>토글</span>
                  </Cap>
                </Spec>
              </Specimens>
            </Block>

            {/* INPUT */}
            <Block id="input">
              <BlockHead>
                <BlockTag className="mono">Components</BlockTag>
                <BlockTitle>입력</BlockTitle>
              </BlockHead>
              <Desc>아이콘·클리어 버튼을 품은 큰 라운드 필드. 3rem 높이, 포커스 시 파란 링.</Desc>
              <SpecFull>
                <Stage>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <FieldLabel>닉네임</FieldLabel>
                    <Field>
                      <span>👤</span>
                      <FieldPlaceholder>이름 입력</FieldPlaceholder>
                      <FieldClear>✕</FieldClear>
                    </Field>
                  </div>
                </Stage>
              </SpecFull>
            </Block>

            {/* CHIP */}
            <Block id="chip">
              <BlockHead>
                <BlockTag className="mono">Components</BlockTag>
                <BlockTitle>칩 · 배지</BlockTitle>
              </BlockHead>
              <Desc>서비스 태그(컬러)·상태 표시·카운트/득표 배지.</Desc>
              <Specimens>
                <Spec>
                  <Stage>
                    <ChipRow>
                      <TagS $bg={product.amber50} $fg={product.amber600}>
                        가계부
                      </TagS>
                      <TagS $bg={product.green50} $fg={product.green600}>
                        다이어트
                      </TagS>
                      <TagS $bg={product.rose50} $fg={product.rose600}>
                        정산
                      </TagS>
                    </ChipRow>
                  </Stage>
                  <Cap>
                    <b>Service Tag</b>
                    <span>컬러 구분</span>
                  </Cap>
                </Spec>
                <Spec>
                  <Stage>
                    <ChipRow>
                      <LinkedTag>연결됨 · 내 가계부</LinkedTag>
                    </ChipRow>
                  </Stage>
                  <Cap>
                    <b>Linked</b>
                    <span>연결 상태</span>
                  </Cap>
                </Spec>
                <Spec>
                  <Stage>
                    <ChipRow>
                      <CountBadge>1</CountBadge>
                      <VoteBadge>2표</VoteBadge>
                    </ChipRow>
                  </Stage>
                  <Cap>
                    <b>Badge</b>
                    <span>카운트·득표</span>
                  </Cap>
                </Spec>
              </Specimens>
            </Block>

            {/* WIDGET */}
            <Block id="widget">
              <BlockHead>
                <BlockTag className="mono">Components</BlockTag>
                <BlockTitle>요약 위젯</BlockTitle>
              </BlockHead>
              <Desc>
                홈 대시보드의 핵심 카드 — 틴트 아이콘 박스 + 서비스명 + 핵심 수치 +
                진행바/보조.
              </Desc>
              <Specimens>
                <Spec>
                  <Stage style={{ background: product.grad }}>
                    <Widget>
                      <WidgetIcon style={{ background: product.amber50 }}>💰</WidgetIcon>
                      <div>
                        <WidgetName>가계부</WidgetName>
                        <WidgetValue>오늘 지출 15,500원</WidgetValue>
                        <WidgetBar>
                          <i style={{ width: "32%" }} />
                        </WidgetBar>
                        <WidgetSub>예산 1,226,466원 남음</WidgetSub>
                      </div>
                    </Widget>
                  </Stage>
                  <Cap>
                    <b>Widget · 진행바</b>
                    <span>가계부</span>
                  </Cap>
                </Spec>
                <Spec>
                  <Stage style={{ background: product.grad }}>
                    <Widget>
                      <WidgetIcon style={{ background: product.green50 }}>🥗</WidgetIcon>
                      <div>
                        <WidgetName>다이어트</WidgetName>
                        <WidgetValue>지금까지 -0.4kg 감량</WidgetValue>
                        <WidgetSub>목표까지 -4.7kg</WidgetSub>
                      </div>
                    </Widget>
                  </Stage>
                  <Cap>
                    <b>Widget · 기본</b>
                    <span>다이어트</span>
                  </Cap>
                </Spec>
              </Specimens>
            </Block>

            {/* BOARD */}
            <Block id="board">
              <BlockHead>
                <BlockTag className="mono">Components</BlockTag>
                <BlockTitle>보드</BlockTitle>
              </BlockHead>
              <Desc>
                위젯을 감싸는 그라데이션 컨테이너. 요약 보드(밝은 블루→인디고)와 방
                보드(깊은 톤)로 구분.
              </Desc>
              <Specimens>
                <Spec>
                  <Stage>
                    <Board style={{ background: product.grad, width: 230 }}>
                      <BoardTitle>✨ 내 서비스 요약</BoardTitle>
                      <BoardSub>가계부 · 다이어트 · 습관 · 운동</BoardSub>
                    </Board>
                  </Stage>
                  <Cap>
                    <b>Board · summary</b>
                    <span>밝은 톤</span>
                  </Cap>
                </Spec>
                <Spec>
                  <Stage>
                    <Board style={{ background: product.gradDeep, width: 230 }}>
                      <BoardTitle>🗓️ 내 약속·정산방</BoardTitle>
                      <BoardSub>진행 중인 이벤트 모아보기</BoardSub>
                    </Board>
                  </Stage>
                  <Cap>
                    <b>Board · rooms</b>
                    <span>깊은 톤</span>
                  </Cap>
                </Spec>
              </Specimens>
            </Block>

            {/* TABS */}
            <Block id="tabs">
              <BlockHead>
                <BlockTag className="mono">Components</BlockTag>
                <BlockTitle>아이콘 탭</BlockTitle>
              </BlockHead>
              <Desc>
                가계부 뷰 전환 — 테두리 없는 텍스트 탭, 활성 항목은 컬러 아이콘 + 진한
                글씨.
              </Desc>
              <SpecFull>
                <Stage>
                  <Tabs>
                    <Tab className="on">
                      <TabIcon>📈</TabIcon>주식
                    </Tab>
                    <Tab>
                      <TabIcon>📅</TabIcon>캘린더
                    </Tab>
                    <Tab>
                      <TabIcon>☰</TabIcon>리스트
                    </Tab>
                    <Tab>
                      <TabIcon>▦</TabIcon>보드
                    </Tab>
                  </Tabs>
                </Stage>
              </SpecFull>
            </Block>

            {/* BUDGET */}
            <Block id="budget">
              <BlockHead>
                <BlockTag className="mono">Components</BlockTag>
                <BlockTitle>예산 · 진행 바</BlockTitle>
              </BlockHead>
              <Desc>소비지출 대비 예산 진행. 정상은 파랑, 초과는 로즈.</Desc>
              <Specimens>
                <Spec>
                  <Stage>
                    <Budget>
                      <BudgetBar>
                        <i style={{ width: "89%" }} />
                      </BudgetBar>
                      <BudgetMeta>
                        <span>소비지출 1,606,188</span>
                        <b>193,812원 남음 (89%)</b>
                      </BudgetMeta>
                    </Budget>
                  </Stage>
                  <Cap>
                    <b>정상</b>
                    <span>남음</span>
                  </Cap>
                </Spec>
                <Spec>
                  <Stage>
                    <Budget>
                      <BudgetBar className="over">
                        <i style={{ width: "100%" }} />
                      </BudgetBar>
                      <BudgetMeta>
                        <span>소비지출 4,998,402</span>
                        <b className="od">3,198,402원 초과</b>
                      </BudgetMeta>
                    </Budget>
                  </Stage>
                  <Cap>
                    <b>초과</b>
                    <span>danger</span>
                  </Cap>
                </Spec>
              </Specimens>
            </Block>

            {/* CALENDAR */}
            <Block id="calendar">
              <BlockHead>
                <BlockTag className="mono">Components</BlockTag>
                <BlockTitle>캘린더 셀 · 상태</BlockTitle>
              </BlockHead>
              <Desc>
                약속 잡기 캘린더의 셀 상태 — 기본 / 불가(인원) / 내 선택 / 확정 선택 /
                확정일 / 선호 히트맵 / 단독 추천.
              </Desc>
              <SpecFull>
                <Stage>
                  <Cal>
                    <Cell>7</Cell>
                    <Cell className="una">
                      13
                      <CellBadge>
                        <CountBadge>1</CountBadge>
                      </CellBadge>
                    </Cell>
                    <Cell className="mine">14</Cell>
                    <Cell className="sel">
                      16
                      <CellBadge>
                        <VoteBadge>2표</VoteBadge>
                      </CellBadge>
                    </Cell>
                    <Cell className="final">20</Cell>
                    <Cell className="vote">
                      21
                      <CellBadge>
                        <VoteBadge>1표</VoteBadge>
                      </CellBadge>
                    </Cell>
                    <Cell>
                      <CellRec>추천👍</CellRec>22
                    </Cell>
                  </Cal>
                </Stage>
              </SpecFull>
              <Note>
                불가=로즈 농도(인원 배지) · 선호=앰버 히트맵(득표수만큼 진하게) · 추천은
                단독 최다 득표일 하나에만.
              </Note>
            </Block>
          </Main>
        </Shell>
      </Wrap>

      <Footer>
        <Wrap>
          🐾 황총무 디자인 시스템 — 실제 제품 스타일 기준. 컴포넌트가 늘면 이 페이지에
          이어서 정리해요.
        </Wrap>
      </Footer>
    </>
  );
}

/* ---------- 페이지 크롬 (앱 테마 토큰 · light/dark 자동 대응) ---------- */

const mono =
  'ui-monospace, "SF Mono", "JetBrains Mono", "D2Coding", monospace';

const Wrap = styled.div`
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 22px;
`;

const Masthead = styled.header`
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
`;

const MastRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 0;
  flex-wrap: wrap;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 13px;
`;

const BrandMark = styled.div`
  width: 46px;
  height: 46px;
  border-radius: 13px;
  background: ${product.grad};
  display: grid;
  place-items: center;
  font-size: 24px;
  box-shadow: 0 10px 22px -12px rgba(59, 91, 219, 0.7);
`;

const BrandTitle = styled.h1`
  font-size: 19px;
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.gray900};
`;

const BrandSub = styled.div`
  font-size: 12.5px;
  color: ${({ theme }) => theme.colors.gray500};
  margin-top: 1px;
`;

const MastMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const BackLink = styled(Link)`
  font-size: 12.5px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray500};
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.semantic.primary};
  }
`;

const MetaText = styled.div`
  font-family: ${mono};
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.gray400};
  text-align: right;

  b {
    color: ${({ theme }) => theme.semantic.primary};
  }
`;

const Shell = styled.div`
  display: grid;
  grid-template-columns: 186px 1fr;
  gap: 34px;
  padding: 30px 0 80px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const Toc = styled.nav`
  position: sticky;
  top: 20px;
  align-self: start;
  font-size: 13.5px;

  @media (max-width: 800px) {
    display: none;
  }
`;

const TocGroup = styled.div`
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 700;
  margin: 16px 0 7px;
`;

const TocLink = styled.a`
  display: block;
  color: ${({ theme }) => theme.colors.gray500};
  text-decoration: none;
  padding: 4px 0 4px 10px;
  border-left: 2px solid transparent;
  margin-left: -12px;

  &:hover {
    color: ${({ theme }) => theme.colors.gray900};
  }
`;

const Main = styled.main`
  min-width: 0;
`;

const Block = styled.section`
  scroll-margin-top: 16px;
  margin-bottom: 40px;
`;

const BlockHead = styled.div`
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 4px 0 3px;
  flex-wrap: wrap;
`;

const BlockTag = styled.span`
  font-family: ${mono};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.semantic.primary};
`;

const BlockTitle = styled.h2`
  font-size: 22px;
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.gray900};
`;

const Desc = styled.p`
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 13.5px;
  margin: 0 0 16px;
  max-width: 62ch;
`;

const Note = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.gray400};
  margin-top: 14px;

  &.mono {
    font-family: ${mono};
  }
`;

const MutedMono = styled.span`
  font-family: ${mono};
  color: ${({ theme }) => theme.colors.gray500};
`;

/* Specimen frame */

const Specimens = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 14px;
`;

const Spec = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.white};
  overflow: hidden;
  box-shadow: 0 10px 30px -20px rgba(30, 40, 110, 0.5);
`;

const SpecFull = styled(Spec)`
  grid-column: 1 / -1;
`;

const Stage = styled.div`
  background: ${({ theme }) => theme.colors.gray100};
  padding: 22px 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 108px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray100};
  overflow-x: auto;
`;

const Cap = styled.div`
  padding: 11px 14px 13px;

  b {
    font-size: 13.5px;
    font-weight: 800;
    display: block;
    color: ${({ theme }) => theme.colors.gray900};
  }

  span {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.gray500};
  }
`;

/* Foundations: swatches */

const SwatchGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(126px, 1fr));
  gap: 12px;
`;

const Swatch = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 13px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.white};
`;

const SwatchChip = styled.div`
  height: 56px;
`;

const SwatchMeta = styled.div`
  padding: 8px 10px;

  b {
    font-size: 12.5px;
    display: block;
    color: ${({ theme }) => theme.colors.gray900};
  }

  span {
    font-size: 11px;
    color: ${({ theme }) => theme.colors.gray500};
  }
`;

/* Foundations: typography */

const TypeRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const TypeSpec = styled.div`
  display: flex;
  align-items: baseline;
  gap: 14px;
  border-bottom: 1px dashed ${({ theme }) => theme.colors.gray200};
  padding-bottom: 12px;
  color: ${({ theme }) => theme.colors.gray900};
`;

const TypeLabel = styled.span`
  width: 120px;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.gray400};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  flex: none;
`;

const ShapeBox = styled.div`
  width: 70px;
  height: 70px;
  background: ${({ theme }) => theme.colors.white};
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.gray200};
`;

/* ---------- 제품 컴포넌트 스펙 (product-accurate 고정 색) ---------- */

/* Buttons */

const BtnPrimary = styled.button`
  border: none;
  background: ${product.primary};
  color: #fff;
  border-radius: 0.9rem;
  padding: 0.75rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
`;

const BtnGhost = styled.button`
  border: 1px solid ${product.gray200};
  background: #fff;
  color: #8a8e95;
  border-radius: 10px;
  padding: 0.55rem 1rem;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
`;

const BtnText = styled.button`
  border: none;
  background: transparent;
  color: ${product.primary};
  font-size: 0.86rem;
  font-weight: 800;
  cursor: pointer;
`;

const PillGroup = styled.div`
  display: flex;
  gap: 0.3rem;
  padding: 0.25rem;
  border-radius: 999px;
  background: #f1f2f3;
`;

const PillButton = styled.button`
  border: none;
  border-radius: 999px;
  padding: 0.5rem 1rem;
  font-size: 0.86rem;
  font-weight: 800;
  cursor: pointer;
  background: transparent;
  color: #8a8e95;

  &.on {
    background: #fff;
    color: ${product.gray900};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
`;

/* Input */

const FieldLabel = styled.span`
  font-size: 0.78rem;
  font-weight: 800;
  color: #6a6f78;
  display: block;
  margin-bottom: 0.3rem;
`;

const Field = styled.div`
  min-height: 3rem;
  width: 220px;
  border: 1px solid ${product.gray200};
  border-radius: 0.9rem;
  padding: 0 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fff;
`;

const FieldPlaceholder = styled.span`
  color: ${product.gray400};
  font-size: 0.95rem;
`;

const FieldClear = styled.span`
  margin-left: auto;
  color: #c2c6cc;
`;

/* Chips / tags / badges */

const ChipRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
`;

const TagS = styled.span<{ $bg: string; $fg: string }>`
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  background: ${({ $bg }) => $bg};
  color: ${({ $fg }) => $fg};
`;

const LinkedTag = styled.span`
  font-size: 0.74rem;
  font-weight: 800;
  color: ${product.primary};
`;

const CountBadge = styled.span`
  background: ${product.rose500};
  color: #fff;
  font-size: 0.62rem;
  font-weight: 800;
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
`;

const VoteBadge = styled.span`
  background: ${product.amber500};
  color: #fff;
  font-size: 0.62rem;
  font-weight: 800;
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
`;

/* Summary widget card */

const Widget = styled.div`
  background: #fff;
  padding: 1.1rem;
  border-radius: 1.25rem;
  box-shadow: 0 8px 18px -8px rgba(23, 43, 77, 0.28);
  display: flex;
  align-items: center;
  gap: 0.8rem;
  width: 270px;
  max-width: 100%;
`;

const WidgetIcon = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 0.8rem;
  display: grid;
  place-items: center;
  font-size: 1.4rem;
  flex: none;
`;

const WidgetName = styled.div`
  font-size: 0.8rem;
  font-weight: 700;
  color: ${product.gray400};
`;

const WidgetValue = styled.div`
  font-size: 1rem;
  font-weight: 800;
  color: ${product.gray900};
  margin: 0.1rem 0;
`;

const WidgetBar = styled.div`
  height: 0.4rem;
  border-radius: 999px;
  background: ${product.gray100};
  overflow: hidden;
  margin: 0.25rem 0;

  i {
    display: block;
    height: 100%;
    background: ${product.primary};
    border-radius: inherit;
  }
`;

const WidgetSub = styled.div`
  font-size: 0.74rem;
  color: ${product.gray400};
`;

/* Board */

const Board = styled.div`
  border-radius: 1.5rem;
  padding: 1rem 1.1rem;
  color: #fff;
  max-width: 100%;
`;

const BoardTitle = styled.h4`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
`;

const BoardSub = styled.div`
  font-size: 0.72rem;
  opacity: 0.85;
  margin-top: 0.2rem;
`;

/* Icon tabs */

const Tabs = styled.div`
  display: inline-flex;
  gap: 1rem;
  align-items: center;
`;

const TabIcon = styled.span`
  font-size: 1.1rem;
  color: #c9cdd6;
`;

const Tab = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  font-weight: 700;
  color: ${product.gray400};
  cursor: pointer;

  &.on {
    color: ${product.gray900};
    font-weight: 800;
  }

  &.on ${TabIcon} {
    color: ${product.blue600};
  }
`;

/* Budget bar */

const Budget = styled.div`
  width: 280px;
  max-width: 100%;
`;

const BudgetBar = styled.div`
  height: 0.4rem;
  border-radius: 999px;
  background: #eceef1;
  overflow: hidden;

  i {
    display: block;
    height: 100%;
    background: ${product.primary};
  }

  &.over i {
    background: ${product.danger};
  }
`;

const BudgetMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  font-weight: 700;
  margin-top: 0.35rem;
  color: #8a8e95;

  b {
    color: ${product.primary};
  }

  b.od {
    color: ${product.danger};
  }
`;

/* Calendar cells */

const Cal = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const CellBadge = styled.span`
  position: absolute;
  top: -6px;
  right: -6px;
`;

const CellRec = styled.span`
  position: absolute;
  top: -9px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.5rem;
  background: ${product.gray100};
  color: ${product.gray500};
  padding: 1px 5px;
  border-radius: 999px;
  white-space: nowrap;
`;

const Cell = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 0.75rem;
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  position: relative;
  background: #fff;
  color: ${product.gray500};
  box-shadow: inset 0 0 0 1px #eceef1;

  &.una {
    background: rgba(251, 113, 133, 0.55);
    color: #fff;
    box-shadow: none;
  }

  &.mine {
    background: ${product.blue600};
    color: #fff;
    border: 2px solid #2b4fc4;
  }

  &.sel {
    border: 2.5px solid ${product.amber500};
    background: ${product.amber50};
    color: ${product.gray900};
  }

  &.final {
    background: ${product.gray900};
    color: #fff;
  }

  &.vote {
    background: rgba(251, 191, 36, 0.4);
    color: ${product.gray500};
  }
`;

/* Footer */

const Footer = styled.footer`
  border-top: 1px solid ${({ theme }) => theme.colors.gray200};
  padding: 26px 0 60px;
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 13px;
  text-align: center;
`;
