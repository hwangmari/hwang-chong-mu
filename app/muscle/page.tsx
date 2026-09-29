"use client";

import { useMemo, useState } from "react";
import ServiceLayout from "@/components/common/ServiceLayout";
import { MUSCLE_GUIDE_DATA } from "@/data/footerGuides";
import BodyMap from "./components/BodyMap";
import { MUSCLES, PART_LABEL, TISSUE } from "./data";
import type { Muscle, MusclePart } from "./types";
import {
  StAlias,
  StBlock,
  StCard,
  StCardHead,
  StCount,
  StDetail,
  StDisclaimer,
  StEmpty,
  StEn,
  StGrid,
  StHead,
  StHeadName,
  StHeadNote,
  StHeads,
  StLabel,
  StLift,
  StLifts,
  StList,
  StName,
  StNote,
  StNoteBody,
  StNoteTitle,
  StPartChip,
  StBodyCol,
  StListCol,
  StPicker,
  StSearch,
  StTab,
  StTabCount,
  StTabs,
  StText,
  StTip,
  StTissue,
  StTissueGrid,
  StTissueTitle,
  StTop,
  StWhere,
} from "./page.styles";

// 근육 도감 — 부위 탭으로 추리고 이름·동작으로 찾는다.
// 저장하는 것이 없는 읽기 전용 화면이라 방(room)도 로그인도 없다. (2026-09-21)

/** 탭 순서 = PART_LABEL 에 적힌 순서 */
const PARTS = Object.keys(PART_LABEL) as MusclePart[];

/** 검색용으로 한 근육을 한 줄 글자로 눌러 둔다 — 이름·영어·별명·위치·하는 일·운동까지 걸린다 */
function haystack(muscle: Muscle): string {
  return [
    muscle.name,
    muscle.alias,
    muscle.en,
    muscle.where,
    ...muscle.actions,
    ...muscle.lifts,
  ]
    .join(" ")
    .toLowerCase();
}

export default function MusclePage() {
  const [part, setPart] = useState<MusclePart | "all">("all");
  const [query, setQuery] = useState("");
  /** 그림에서 근육 하나를 콕 집었을 때 — 그 근육만 크게 본다 */
  const [pickedId, setPickedId] = useState<string | null>(null);

  const keyword = query.trim().toLowerCase();

  /** 검색은 부위를 가리지 않는다 — 이름을 아는 사람이 탭까지 맞출 필요는 없으니 */
  const found = useMemo(() => {
    if (pickedId) return MUSCLES.filter((muscle) => muscle.id === pickedId);
    const byPart = part === "all" ? MUSCLES : MUSCLES.filter((m) => m.part === part);
    if (!keyword) return byPart;
    return MUSCLES.filter((muscle) => haystack(muscle).includes(keyword));
  }, [part, keyword, pickedId]);

  /** 부위를 고르거나 근육을 집으면 해부학 상세 칸까지 펼친다 */
  const detailed = pickedId !== null || (part !== "all" && !keyword);

  const pickPart = (next: MusclePart | "all") => {
    setPart(next);
    setPickedId(null);
    setQuery("");
  };

  const pickMuscle = (id: string) => {
    const muscle = MUSCLES.find((item) => item.id === id);
    if (!muscle) return;
    setPart(muscle.part);
    setPickedId(id);
    setQuery("");
  };

  const countOf = useMemo(() => {
    const counts = new Map<MusclePart, number>();
    for (const muscle of MUSCLES) counts.set(muscle.part, (counts.get(muscle.part) ?? 0) + 1);
    return counts;
  }, []);

  return (
    <ServiceLayout
      width="wide"
      intro={{
        icon: "💪",
        title: "근육 도감",
        description: (
          <>
            어느 근육이 어디에 있고 무슨 일을 하는지, 어떤 운동으로 쓰고 어떻게 늘리는지
            한 곳에 모았어요. 부위를 고르거나 이름으로 찾아보세요.
          </>
        ),
      }}
      guide={{
        title: MUSCLE_GUIDE_DATA.title,
        story: MUSCLE_GUIDE_DATA.story,
        tips: MUSCLE_GUIDE_DATA.tips,
      }}
    >
      <StPicker>
        {/* 왼쪽 6 — 그림에서 근육을 누르면 오른쪽 목록이 그 근육만 남는다 */}
        <StBodyCol>
        <BodyMap
          part={part}
          activeId={pickedId}
          onPickMuscle={pickMuscle}
          onReset={() => pickPart("all")}
        />
        </StBodyCol>

        {/* 오른쪽 4 — 검색·탭과 근육 카드 */}
        <StListCol>
        <StTop>
          <StSearch
          type="search"
          value={query}
          placeholder="근육 이름·운동 이름으로 찾기 (예: 광배근, 스쿼트)"
          aria-label="근육 찾기"
          data-testid="muscle-search"
          onChange={(event) => {
            // 검색은 부위를 가리지 않으므로 탭도 전체로 돌려 둔다 — 탭은 골라져 있는데
            // 다른 부위 결과가 나오는 어긋남을 막는다 (검토 반영 2026-09-21)
            setQuery(event.target.value);
            setPickedId(null);
            if (event.target.value.trim()) setPart("all");
          }}
          />

          <StTabs role="tablist" aria-label="부위">
          <StTab
            type="button"
            role="tab"
            aria-selected={part === "all"}
            $active={part === "all"}
            data-testid="muscle-tab-all"
            onClick={() => pickPart("all")}
          >
            전체
            <StTabCount>{MUSCLES.length}</StTabCount>
          </StTab>
          {PARTS.map((id) => (
            <StTab
              key={id}
              type="button"
              role="tab"
              aria-selected={part === id}
              $active={part === id}
              data-testid={`muscle-tab-${id}`}
              onClick={() => pickPart(id)}
            >
              {PART_LABEL[id]}
              <StTabCount>{countOf.get(id) ?? 0}</StTabCount>
            </StTab>
          ))}
          </StTabs>

          {/* 검색 중에는 탭을 벗어난 결과도 나오므로 몇 곳인지 알려 준다 */}
          <StCount data-testid="muscle-count">
          {pickedId
            ? `${found[0]?.alias ?? ""} 하나만 보는 중 — 그림에서 다른 근육을 누르거나 탭을 누르면 돌아가요`
            : keyword
              ? `"${query.trim()}" 로 찾은 근육 ${found.length}개 (부위 상관없이)`
              : `${part === "all" ? "전체" : PART_LABEL[part]} 근육 ${found.length}개`}
          </StCount>
        </StTop>

      {found.length === 0 ? (
        <StEmpty data-testid="muscle-empty">
          찾는 이름이 없어요. 흔히 쓰는 이름(대흉근)과 우리말 이름(큰가슴근) 둘 다 되니
          다른 쪽으로도 적어 보세요.
        </StEmpty>
      ) : (
        <StGrid>
          {found.map((muscle) => (
            <StCard key={muscle.id} data-testid="muscle-card">
              <StCardHead>
                {/* 흔히 쓰는 이름(대흉근·햄스트링)을 앞에, 우리말 해부학 이름을 뒤에 (주인 요청 2026-09-21) */}
                <StName>{muscle.alias}</StName>
                <StAlias>{muscle.name}</StAlias>
                <StEn>{muscle.en}</StEn>
                <StPartChip>{PART_LABEL[muscle.part]}</StPartChip>
              </StCardHead>

              <StWhere>{muscle.where}</StWhere>

              {/* 갈래 — 한 근육이 여러 머리·부분으로 나뉠 때 (예: 대흉근 쇄골부·흉골부·복부) */}
              {muscle.heads && muscle.heads.length > 0 && (
                <StBlock data-testid="muscle-heads">
                  <StLabel>갈래 {muscle.heads.length}</StLabel>
                  <StHeads>
                    {muscle.heads.map((head) => (
                      <StHead key={head.name}>
                        <StHeadName>{head.name}</StHeadName>
                        <StHeadNote>{head.note}</StHeadNote>
                      </StHead>
                    ))}
                  </StHeads>
                </StBlock>
              )}

              <StBlock>
                <StLabel>하는 일</StLabel>
                <StList>
                  {muscle.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </StList>
              </StBlock>

              <StBlock>
                <StLabel>대표 운동</StLabel>
                <StLifts>
                  {muscle.lifts.map((lift) => (
                    <StLift key={lift}>{lift}</StLift>
                  ))}
                </StLifts>
              </StBlock>

              <StBlock>
                <StLabel>늘리기</StLabel>
                <StText>{muscle.stretch}</StText>
              </StBlock>

              {/* 부위를 고르거나 그림에서 집었을 때만 — 전체 목록에서는 카드가 너무 길어진다 */}
              {detailed && (muscle.origin || muscle.insertion || muscle.nerve) && (
                <StDetail data-testid="muscle-detail">
                  {muscle.origin && (
                    <>
                      <dt>이는곳</dt>
                      <dd>{muscle.origin}</dd>
                    </>
                  )}
                  {muscle.insertion && (
                    <>
                      <dt>닿는곳</dt>
                      <dd>{muscle.insertion}</dd>
                    </>
                  )}
                  {muscle.nerve && (
                    <>
                      <dt>신경</dt>
                      <dd>{muscle.nerve}</dd>
                    </>
                  )}
                  {muscle.fiber && (
                    <>
                      <dt>근섬유</dt>
                      <dd>{muscle.fiber}</dd>
                    </>
                  )}
                  {muscle.partners && (
                    <>
                      <dt>짝 근육</dt>
                      <dd>{muscle.partners}</dd>
                    </>
                  )}
                </StDetail>
              )}

              {muscle.tip && <StTip>{muscle.tip}</StTip>}
            </StCard>
          ))}
        </StGrid>
      )}
        </StListCol>
      </StPicker>

      {/* 읽을거리는 아래 — 찾으러 온 사람이 먼저 목록을 보게 */}
      <StTissue aria-labelledby="tissue-title">
        <StTissueTitle id="tissue-title">근육은 어떻게 생겼나</StTissueTitle>
        <StTissueGrid>
          {TISSUE.map((note) => (
            <StNote key={note.id} data-testid="tissue-note">
              <StNoteTitle>{note.title}</StNoteTitle>
              <StNoteBody>{note.body}</StNoteBody>
            </StNote>
          ))}
        </StTissueGrid>
        <StDisclaimer>
          일반적인 해부학 상식을 쉬운 말로 정리한 자료예요. 아픈 곳을 진단하거나 치료법을
          알려 주는 곳은 아니니, 통증이 2주 넘게 이어지면 병원에서 봐 주세요.
        </StDisclaimer>
      </StTissue>
    </ServiceLayout>
  );
}
