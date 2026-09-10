"use client";

import { useMemo, useState } from "react";
import ExchangeTable from "./ExchangeTable";
import ReturnAmountForm from "./ReturnAmountForm";
import {
  StBulkBar,
  StBulkRow,
  StBulkTitle,
  StCard,
  StCardHead,
  StCardHint,
  StCardTitle,
  StChip,
  StChipRow,
  StDelBtn,
  StEditBtn,
  StEmpty,
  StError,
  StFilterRow,
  StGhostBtn,
  StGroupHead,
  StGroupMeta,
  StGroupTitle,
  StRecordActions,
  StRecordAmount,
  StRecordDate,
  StRecordList,
  StRecordMain,
  StRecordMemo,
  StRecordItem,
  StRecordMeta,
  StRecordName,
  StRecordRow,
  StRecordTop,
  StReturnedChip,
  StReturnLine,
  StRowActionBtn,
  StSegmentBtn,
  StSegmentRow,
  StSmallInput,
  StPrimarySmallBtn,
  StTable,
  StTableWrap,
  StTag,
} from "../page.styles";
import {
  DIRECTION_KEYS,
  DIRECTION_LABEL,
  DIRECTION_TONE,
  EVENT_TYPE_ICON,
  EVENT_TYPE_KEYS,
  EVENT_TYPE_LABEL,
  EVENT_TYPE_TONE,
  RELATION_DETAIL_PLACEHOLDER,
  RELATION_KEYS,
  RELATION_LABEL,
  RELATION_TONE,
  type GiftDirection,
  type GiftEntry,
  type GiftEventType,
  type GiftRelation,
  type GiftTone,
} from "../types";
import { formatAmount, formatSigned } from "./giftFormat";
import { findReturnEntry, type ReturnPayment } from "../returned";

type Filter = "all" | GiftDirection;
type RelationFilter = "all" | GiftRelation;
type ViewMode = "list" | "table" | "exchange";

const FILTERS: { key: Filter; label: string; tone: GiftTone }[] = [
  { key: "all", label: "전체", tone: "blue" },
  { key: "given", label: DIRECTION_LABEL.given, tone: DIRECTION_TONE.given },
  {
    key: "received",
    label: DIRECTION_LABEL.received,
    tone: DIRECTION_TONE.received,
  },
];

const VIEWS: { key: ViewMode; label: string }[] = [
  { key: "list", label: "목록" },
  { key: "table", label: "표" },
  { key: "exchange", label: "주고받음 대조" },
];

// 표 보기의 묶음 단위: 종류 × 방향. 예) "결혼 · 받았어요" = 내 결혼식 축의금 명단
type Group = {
  eventType: GiftEventType;
  direction: GiftDirection;
  entries: GiftEntry[];
  total: number;
};

function buildGroups(entries: GiftEntry[]): Group[] {
  const groups: Group[] = [];
  for (const direction of DIRECTION_KEYS) {
    for (const eventType of EVENT_TYPE_KEYS) {
      const list = entries.filter(
        (e) => e.eventType === eventType && e.direction === direction,
      );
      if (list.length === 0) continue;
      groups.push({
        eventType,
        direction,
        // 종이 장부처럼 적은 순서 그대로 (entries가 이미 날짜·담은 순으로 정렬돼 있다)
        entries: list,
        total: list.reduce((sum, e) => sum + e.amount, 0),
      });
    }
  }
  // 건수 많은 묶음(내 결혼식 등)이 위로
  return groups.sort((a, b) => b.entries.length - a.entries.length);
}

function relationText(entry: GiftEntry) {
  return entry.relationDetail
    ? `${RELATION_LABEL[entry.relation]} · ${entry.relationDetail}`
    : RELATION_LABEL[entry.relation];
}

type EntryHistoryProps = {
  loading: boolean;
  entries: GiftEntry[];
  suggestDetails: (relation: GiftRelation) => string[];
  busy: boolean;
  // 저장·표시 변경이 실패했을 때의 안내 (입력 탭과 같은 문구를 여기서도 보여 준다)
  error: string;
  onEdit: (entry: GiftEntry) => void;
  onRemove: (id: string) => void;
  // "냈음" 표시를 켠다. paid 가 있으면 그 금액으로 "냈어요" 기록도 함께 만든다
  onMarkReturned: (
    received: GiftEntry,
    ids: string[],
    paid: ReturnPayment | null,
  ) => Promise<void>;
  // "냈음" 표시를 끈다. 짝지어진 "냈어요" 기록이 있으면 같이 지울지 물어본다
  onUnmarkReturned: (received: GiftEntry, ids: string[]) => Promise<void>;
  // 표에서 체크한 여러 명의 관계를 한 번에 바꾼다
  onChangeRelationMany: (
    ids: string[],
    relation: GiftRelation,
    relationDetail: string,
  ) => Promise<void>;
};

export default function EntryHistory({
  loading,
  entries,
  suggestDetails,
  busy,
  error,
  onEdit,
  onRemove,
  onMarkReturned,
  onUnmarkReturned,
  onChangeRelationMany,
}: EntryHistoryProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [relationFilter, setRelationFilter] = useState<RelationFilter>("all");
  const [view, setView] = useState<ViewMode>("list");
  // 금액 적기 폼을 연 받은 기록. mark = 아직 표시 전, fill = 표시는 됐고 금액만 채우는 중
  const [returnFor, setReturnFor] = useState<{
    id: string;
    mode: "mark" | "fill";
  } | null>(null);

  // 표 편집 모드: 켜져 있을 때만 체크박스와 "관계 한번에 바꾸기" 상자가 보인다
  const [editMode, setEditMode] = useState(false);
  // 표에서 체크한 기록 id들 + 한 번에 바꿀 관계
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [bulkRelation, setBulkRelation] = useState<GiftRelation>("friend");
  const [bulkDetail, setBulkDetail] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState("");

  const visible = entries.filter(
    (entry) =>
      (filter === "all" || entry.direction === filter) &&
      (relationFilter === "all" || entry.relation === relationFilter),
  );

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // 묶음 단위 전체 선택/해제
  function toggleGroup(ids: string[]) {
    setSelected((prev) => {
      const next = new Set(prev);
      const allOn = ids.every((id) => next.has(id));
      for (const id of ids) {
        if (allOn) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  async function applyBulkRelation() {
    if (selected.size === 0) return;
    setBulkBusy(true);
    setBulkError("");
    try {
      await onChangeRelationMany([...selected], bulkRelation, bulkDetail.trim());
      setSelected(new Set());
      setBulkDetail("");
    } catch (e) {
      setBulkError(e instanceof Error ? e.message : "바꾸는 중 문제가 생겼어요.");
    } finally {
      setBulkBusy(false);
    }
  }

  const bulkSuggestions = suggestDetails(bulkRelation);

  function toggleEditMode() {
    setEditMode((on) => !on);
    setSelected(new Set());
    setBulkError("");
  }

  const groups = useMemo(
    () => (view === "table" ? buildGroups(visible) : []),
    [view, visible],
  );

  return (
    <StCard>
      <StCardHead>
        <StCardTitle>📜 전체 내역</StCardTitle>
        <StSegmentRow role="tablist" aria-label="보기 방식">
          {VIEWS.map((item) => (
            <StSegmentBtn
              key={item.key}
              type="button"
              role="tab"
              aria-selected={view === item.key}
              $active={view === item.key}
              $tone="blue"
              onClick={() => setView(item.key)}
            >
              {item.label}
            </StSegmentBtn>
          ))}
        </StSegmentRow>
      </StCardHead>
      {error ? <StError>{error}</StError> : null}
      {view === "exchange" ? null : (
        /* 방향은 토글 하나로, 관계는 작은 칩으로 — 한 줄에 */
        <StFilterRow>
          <StSegmentRow aria-label="주고받은 방향">
            {FILTERS.map((item) => (
              <StSegmentBtn
                key={item.key}
                type="button"
                $active={filter === item.key}
                $tone={item.tone}
                onClick={() => setFilter(item.key)}
              >
                {item.label}
              </StSegmentBtn>
            ))}
          </StSegmentRow>
          <StChipRow>
            <StChip
              type="button"
              $active={relationFilter === "all"}
              $tone="blue"
              onClick={() => setRelationFilter("all")}
            >
              관계 전체
            </StChip>
            {RELATION_KEYS.map((key) => (
              <StChip
                key={key}
                type="button"
                $active={relationFilter === key}
                $tone={RELATION_TONE[key]}
                onClick={() => setRelationFilter(key)}
              >
                {RELATION_LABEL[key]}
              </StChip>
            ))}
          </StChipRow>
        </StFilterRow>
      )}

      {view === "exchange" ? (
        <ExchangeTable
          entries={entries}
          busy={busy}
          onMarkReturned={onMarkReturned}
          onUnmarkReturned={onUnmarkReturned}
        />
      ) : loading ? (
        <StEmpty>불러오는 중...</StEmpty>
      ) : visible.length === 0 ? (
        <StEmpty>
          {entries.length === 0
            ? "아직 기록이 없어요. 위에서 첫 기록을 남겨보세요."
            : "이 조건에 맞는 기록이 없어요."}
        </StEmpty>
      ) : view === "table" ? (
        <>
          <StCardHead>
            <StCardHint>
              같은 종류끼리 묶은 명단이에요. 예) &ldquo;결혼 · 받았어요&rdquo;는
              내 결혼식 축의금, &ldquo;장례 · 받았어요&rdquo;는 조의금 명단.
              {editMode ? "" : " 여러 명의 관계를 한 번에 바꾸려면 편집을 누르세요."}
            </StCardHint>
            <StGhostBtn type="button" onClick={toggleEditMode}>
              {editMode ? "편집 끝내기" : "✏️ 편집"}
            </StGhostBtn>
          </StCardHead>
          {editMode ? (
            <StBulkBar>
              <StBulkTitle>
                {selected.size > 0
                  ? `체크한 ${selected.size}명의 관계를`
                  : "관계를 바꿀 사람을 표에서 체크하세요"}
                {selected.size > 0 ? (
                  <StGhostBtn type="button" onClick={() => setSelected(new Set())}>
                    선택 해제
                  </StGhostBtn>
                ) : null}
              </StBulkTitle>
              <StChipRow>
                {RELATION_KEYS.map((key) => (
                  <StChip
                    key={key}
                    type="button"
                    $active={bulkRelation === key}
                    $tone={RELATION_TONE[key]}
                    onClick={() => setBulkRelation(key)}
                  >
                    {RELATION_LABEL[key]}
                  </StChip>
                ))}
              </StChipRow>
              {bulkSuggestions.length > 0 ? (
                <StChipRow>
                  {bulkSuggestions.map((detail) => (
                    <StChip
                      key={detail}
                      type="button"
                      $active={bulkDetail === detail}
                      $tone={RELATION_TONE[bulkRelation]}
                      onClick={() => setBulkDetail(detail)}
                    >
                      {detail}
                    </StChip>
                  ))}
                </StChipRow>
              ) : null}
              <StBulkRow>
                <StSmallInput
                  type="text"
                  placeholder={`관계 세부 (선택) ${RELATION_DETAIL_PLACEHOLDER[bulkRelation]}`}
                  value={bulkDetail}
                  maxLength={40}
                  onChange={(e) => setBulkDetail(e.target.value)}
                />
                <StPrimarySmallBtn
                  type="button"
                  disabled={bulkBusy || selected.size === 0}
                  onClick={applyBulkRelation}
                >
                  {bulkBusy
                    ? "바꾸는 중..."
                    : `${RELATION_LABEL[bulkRelation]}${bulkDetail.trim() ? ` · ${bulkDetail.trim()}` : ""}(으)로 바꾸기`}
                </StPrimarySmallBtn>
              </StBulkRow>
              {bulkError ? <StError>{bulkError}</StError> : null}
            </StBulkBar>
          ) : null}
          {groups.map((group) => (
            <div key={`${group.eventType}|${group.direction}`}>
              <StGroupHead>
                <StGroupTitle>
                  {EVENT_TYPE_ICON[group.eventType]}{" "}
                  {EVENT_TYPE_LABEL[group.eventType]}
                  <StTag $tone={DIRECTION_TONE[group.direction]}>
                    {DIRECTION_LABEL[group.direction]}
                  </StTag>
                </StGroupTitle>
                <StGroupMeta>
                  {group.entries.length}명 · {formatAmount(group.total)}
                </StGroupMeta>
              </StGroupHead>
              <StTableWrap>
                <StTable $minWidth="40rem">
                  {/* 묶음마다 표가 따로 그려지므로 열 너비를 못박아 서로 맞춘다 */}
                  <colgroup>
                    {editMode ? <col style={{ width: "5%" }} /> : null}
                    <col style={{ width: editMode ? "17%" : "18%" }} />
                    <col style={{ width: editMode ? "17%" : "18%" }} />
                    <col style={{ width: editMode ? "15%" : "16%" }} />
                    <col style={{ width: editMode ? "16%" : "17%" }} />
                    <col style={{ width: editMode ? "16%" : "17%" }} />
                    <col style={{ width: "14%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      {editMode ? (
                        <th className="check">
                          <input
                            type="checkbox"
                            aria-label="이 묶음 전체 선택"
                            checked={group.entries.every((e) => selected.has(e.id))}
                            onChange={() => toggleGroup(group.entries.map((e) => e.id))}
                          />
                        </th>
                      ) : null}
                      <th>이름</th>
                      <th>관계</th>
                      <th className="amount">금액</th>
                      <th>날짜</th>
                      <th>메모</th>
                      <th className="actions" aria-label="동작" />
                    </tr>
                  </thead>
                  <tbody>
                    {group.entries.map((entry) => (
                      <tr key={entry.id}>
                        {editMode ? (
                          <td className="check">
                            <input
                              type="checkbox"
                              aria-label={`${entry.personName} 선택`}
                              checked={selected.has(entry.id)}
                              onChange={() => toggleSelected(entry.id)}
                            />
                          </td>
                        ) : null}
                        <td title={entry.personName}>
                          <b>{entry.personName}</b>
                        </td>
                        <td title={relationText(entry)}>{relationText(entry)}</td>
                        <td className={`amount ${entry.direction}`}>
                          {formatAmount(entry.amount)}
                        </td>
                        <td>{entry.date}</td>
                        <td className="memo">{entry.memo}</td>
                        <td className="actions">
                          <StRowActionBtn
                            type="button"
                            onClick={() => onEdit(entry)}
                          >
                            수정
                          </StRowActionBtn>
                          <StRowActionBtn
                            type="button"
                            onClick={() => onRemove(entry.id)}
                          >
                            삭제
                          </StRowActionBtn>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={editMode ? 3 : 2}>합계 {group.entries.length}명</td>
                      <td className="amount">{formatAmount(group.total)}</td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </StTable>
              </StTableWrap>
            </div>
          ))}
        </>
      ) : (
        <StRecordList>
          {visible.map((entry) => {
            const received = entry.direction === "received";
            // 답례로 낸 기록(같은 사람·같은 종류·받은 날 이후 첫 건)
            const paidBack =
              received && entry.returned ? findReturnEntry(entries, entry) : null;
            const formOpen = returnFor?.id === entry.id;
            return (
              <StRecordItem key={entry.id}>
                {/* 한 줄 = 날짜 | 이름·태그 | 금액 | 수정·삭제 고정 열 — 줄마다 같은 자리에 같은 것 (2026-09-10) */}
                <StRecordRow>
                  <StRecordDate dateTime={entry.date}>{entry.date}</StRecordDate>
                  <StRecordMain>
                    <StRecordTop>
                      <StRecordName>{entry.personName}</StRecordName>
                      <StRecordMeta>
                        <StTag $tone={EVENT_TYPE_TONE[entry.eventType]}>
                          {EVENT_TYPE_ICON[entry.eventType]}{" "}
                          {EVENT_TYPE_LABEL[entry.eventType]}
                        </StTag>
                        <StTag $tone={RELATION_TONE[entry.relation]}>
                          {relationText(entry)}
                        </StTag>
                      </StRecordMeta>
                    </StRecordTop>
                    {entry.memo ? (
                      <StRecordMemo>{entry.memo}</StRecordMemo>
                    ) : null}
                    {received ? (
                      <StReturnLine>
                        {entry.returned ? (
                          <>
                            {paidBack ? (
                              <StReturnedChip
                                type="button"
                                $tone="teal"
                                title="금액·날짜 고치기"
                                onClick={() => onEdit(paidBack)}
                              >
                                ✓ 냈음 · {formatAmount(paidBack.amount)}
                              </StReturnedChip>
                            ) : (
                              <>
                                <StReturnedChip as="span" $tone="gray" $flat>
                                  ✓ 냈음 · 금액 미기록
                                </StReturnedChip>
                                <StRowActionBtn
                                  type="button"
                                  $tone="blue"
                                  onClick={() =>
                                    setReturnFor({ id: entry.id, mode: "fill" })
                                  }
                                >
                                  금액 적기
                                </StRowActionBtn>
                              </>
                            )}
                            <StRowActionBtn
                              type="button"
                              disabled={busy}
                              onClick={() => onUnmarkReturned(entry, [entry.id])}
                            >
                              냈음 취소
                            </StRowActionBtn>
                          </>
                        ) : (
                          /* 한 번 더 누르면 폼을 닫는다 — 잘못 눌렀을 때 빠져나올 길 */
                          <StRowActionBtn
                            type="button"
                            $tone={DIRECTION_TONE.given}
                            onClick={() =>
                              setReturnFor(
                                formOpen ? null : { id: entry.id, mode: "mark" },
                              )
                            }
                          >
                            💸 냈음 표시
                          </StRowActionBtn>
                        )}
                      </StReturnLine>
                    ) : null}
                  </StRecordMain>
                  <StRecordAmount $tone={DIRECTION_TONE[entry.direction]}>
                    {formatSigned(entry.amount, entry.direction)}
                  </StRecordAmount>
                  <StRecordActions>
                    <StEditBtn type="button" onClick={() => onEdit(entry)}>
                      수정
                    </StEditBtn>
                    <StDelBtn type="button" onClick={() => onRemove(entry.id)}>
                      삭제
                    </StDelBtn>
                  </StRecordActions>
                </StRecordRow>
                {formOpen && returnFor ? (
                  <ReturnAmountForm
                    personName={entry.personName}
                    receivedDate={entry.date}
                    mode={returnFor.mode}
                    busy={busy}
                    onSave={async (date, amount) => {
                      await onMarkReturned(entry, [entry.id], { date, amount });
                      setReturnFor(null);
                    }}
                    onSkipAmount={async () => {
                      await onMarkReturned(entry, [entry.id], null);
                      setReturnFor(null);
                    }}
                    onClose={() => setReturnFor(null)}
                  />
                ) : null}
              </StRecordItem>
            );
          })}
        </StRecordList>
      )}
    </StCard>
  );
}
