"use client";

import { useMemo, useState } from "react";
import { buildPersonSummaries, searchPersons } from "../aggregate";
import {
  StAmount,
  StAnswer,
  StBadge,
  StCard,
  StCardHead,
  StCardHint,
  StCardTitle,
  StChipRow,
  StEmpty,
  StGhostBtn,
  StInput,
  StNameChip,
  StPersonBox,
  StPersonHead,
  StPersonName,
  StTag,
  StTable,
  StTableWrap,
  StTimeline,
  StTimelineRow,
} from "../page.styles";
import {
  DIRECTION_COLOR,
  EVENT_TYPE_COLOR,
  EVENT_TYPE_ICON,
  EVENT_TYPE_KEYS,
  EVENT_TYPE_LABEL,
  RELATION_COLOR,
  RELATION_LABEL,
  type GiftEntry,
  type GiftRelation,
} from "../types";
import {
  formatAmount,
  formatBalance,
  formatDateKo,
  formatSigned,
} from "./giftFormat";

const MAX_NAME_CHIPS = 8;

// 한 사람의 기록을 종류별(결혼/장례…)로 나눠 받은·낸·상태를 계산. 축의금과 부의금은 섞지 않는다.
function byEventType(entries: GiftEntry[]) {
  return EVENT_TYPE_KEYS.map((key) => {
    const list = entries.filter((e) => e.eventType === key);
    if (list.length === 0) return null;
    const received = list
      .filter((e) => e.direction === "received")
      .reduce((s, e) => s + e.amount, 0);
    const given = list
      .filter((e) => e.direction === "given")
      .reduce((s, e) => s + e.amount, 0);
    const marked = list.some((e) => e.direction === "received" && e.returned);
    const lastGiven = list.find((e) => e.direction === "given") ?? null;
    return { key, received, given, marked, lastGiven };
  }).filter((row): row is NonNullable<typeof row> => row !== null);
}

function statusLabel(row: {
  received: number;
  given: number;
  marked: boolean;
}) {
  if (row.given > 0) return { tone: "good" as const, text: "✓ 냈음" };
  if (row.marked)
    return { tone: "good" as const, text: "✓ 냈음 (금액 미기록)" };
  if (row.received > 0) return { tone: "bad" as const, text: "아직 안 냄" };
  return { tone: "neutral" as const, text: "받은 것 없음" };
}

type PersonLookupProps = {
  entries: GiftEntry[];
  // "이 사람으로 새 기록" → 폼에 이름·관계를 채워준다
  onNewForPerson: (
    personName: string,
    relation: GiftRelation,
    relationDetail: string,
  ) => void;
};

export default function PersonLookup({
  entries,
  onNewForPerson,
}: PersonLookupProps) {
  const [keyword, setKeyword] = useState("");
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const summaries = useMemo(() => buildPersonSummaries(entries), [entries]);
  const matched = useMemo(
    () => searchPersons(summaries, keyword),
    [summaries, keyword],
  );

  // 검색어가 한 명으로 좁혀지면 자동 선택, 아니면 칩에서 고른 사람
  const selected =
    (selectedName && summaries.find((s) => s.personName === selectedName)) ||
    (keyword.trim() && matched.length === 1 ? matched[0] : null);

  const chips = matched.slice(0, MAX_NAME_CHIPS);

  return (
    <StCard>
      <StCardHead>
        <StCardTitle>🔍 이 사람, 얼마 했었지?</StCardTitle>
      </StCardHead>

      <StInput
        type="search"
        placeholder="이름으로 찾기 (예: 김철수)"
        value={keyword}
        onChange={(e) => {
          setKeyword(e.target.value);
          setSelectedName(null);
        }}
        disabled={entries.length === 0}
      />

      {entries.length === 0 ? (
        <StEmpty>
          기록이 쌓이면 여기서 이름만 쳐도 <b>지난번에 얼마 했는지</b> 바로
          나와요.
        </StEmpty>
      ) : chips.length === 0 ? (
        <StEmpty>&ldquo;{keyword}&rdquo; 이름으로 된 기록이 없어요.</StEmpty>
      ) : (
        <StChipRow>
          {chips.map((summary) => (
            <StNameChip
              key={summary.personName}
              type="button"
              $active={selected?.personName === summary.personName}
              onClick={() =>
                setSelectedName((prev) =>
                  prev === summary.personName ? null : summary.personName,
                )
              }
            >
              {summary.personName}
            </StNameChip>
          ))}
          {matched.length > MAX_NAME_CHIPS ? (
            <StCardHint>
              외 {matched.length - MAX_NAME_CHIPS}명 — 이름을 더 입력해 보세요
            </StCardHint>
          ) : null}
        </StChipRow>
      )}

      {selected ? (
        <StPersonBox>
          <StPersonHead>
            <StPersonName>
              {selected.personName}
              <StTag $color={RELATION_COLOR[selected.relation]}>
                {RELATION_LABEL[selected.relation]}
                {selected.relationDetail ? ` · ${selected.relationDetail}` : ""}
              </StTag>
            </StPersonName>
            <StGhostBtn
              type="button"
              onClick={() =>
                onNewForPerson(
                  selected.personName,
                  selected.relation,
                  selected.relationDetail,
                )
              }
            >
              + 이 사람으로 새 기록
            </StGhostBtn>
          </StPersonHead>

          <StTableWrap>
            <StTable>
              <thead>
                <tr>
                  <th>종류</th>
                  <th className="amount">받은 돈</th>
                  <th className="amount">낸 돈</th>
                  <th className="amount">차액</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {byEventType(selected.entries).map((row) => {
                  const st = statusLabel(row);
                  const balance = row.received - row.given;
                  return (
                    <tr key={row.key}>
                      <td>
                        <b>
                          {EVENT_TYPE_ICON[row.key]} {EVENT_TYPE_LABEL[row.key]}
                        </b>
                      </td>
                      <td
                        className="amount"
                        style={{ color: DIRECTION_COLOR.received }}
                      >
                        {row.received ? formatAmount(row.received) : "–"}
                      </td>
                      <td
                        className="amount"
                        style={{ color: DIRECTION_COLOR.given }}
                      >
                        {row.given
                          ? formatAmount(row.given)
                          : row.marked
                            ? "냈음"
                            : "–"}
                      </td>
                      <td className="amount">
                        {row.marked && !row.given ? (
                          <StBadge $tone="neutral">금액 미기록</StBadge>
                        ) : (
                          <StBadge
                            $tone={
                              balance > 0
                                ? "good"
                                : balance < 0
                                  ? "bad"
                                  : "neutral"
                            }
                          >
                            {formatBalance(balance)}
                          </StBadge>
                        )}
                      </td>
                      <td>
                        <StBadge $tone={st.tone}>{st.text}</StBadge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </StTable>
          </StTableWrap>

          {(() => {
            // 즉답: 가장 최근에 낸 기록을 종류와 함께
            const rows = byEventType(selected.entries);
            const pending = rows.filter(
              (r) => r.received > 0 && r.given === 0 && !r.marked,
            );
            if (selected.lastGiven) {
              return (
                <StAnswer>
                  지난번 {formatDateKo(selected.lastGiven.date)}{" "}
                  {EVENT_TYPE_LABEL[selected.lastGiven.eventType]}에{" "}
                  <b>{formatAmount(selected.lastGiven.amount)}</b> 냈어요.
                  {pending.length > 0
                    ? ` 다만 ${pending.map((r) => EVENT_TYPE_LABEL[r.key]).join("·")}은 받기만 하고 아직 안 냈어요.`
                    : ""}
                </StAnswer>
              );
            }
            if (pending.length > 0) {
              return (
                <StAnswer>
                  아직 이 사람에게 낸 기록이 없어요.{" "}
                  {pending.map((r) => (
                    <span key={r.key}>
                      {EVENT_TYPE_LABEL[r.key]}로 받은{" "}
                      <b>{formatAmount(r.received)}</b>{" "}
                    </span>
                  ))}
                  을 기준으로 답례를 생각해 보세요.
                </StAnswer>
              );
            }
            return (
              <StAnswer>
                주고받은 기록이 정리돼 있어요. 아래 내역을 확인하세요.
              </StAnswer>
            );
          })()}

          <StTimeline>
            {selected.entries.map((entry) => (
              <StTimelineRow key={entry.id}>
                <time>{entry.date}</time>
                <StTag $color={EVENT_TYPE_COLOR[entry.eventType]}>
                  {EVENT_TYPE_ICON[entry.eventType]}{" "}
                  {EVENT_TYPE_LABEL[entry.eventType]}
                </StTag>
                {entry.memo ? <span>{entry.memo}</span> : null}
                <StAmount $color={DIRECTION_COLOR[entry.direction]}>
                  {formatSigned(entry.amount, entry.direction)}
                </StAmount>
              </StTimelineRow>
            ))}
          </StTimeline>
        </StPersonBox>
      ) : null}
    </StCard>
  );
}
