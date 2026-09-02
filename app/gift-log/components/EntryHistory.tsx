"use client";

import { useMemo, useState } from "react";
import ExchangeTable from "./ExchangeTable";
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
  StRecordName,
  StRecordRow,
  StRecordTop,
  StRowActionBtn,
  StSmallInput,
  StPrimarySmallBtn,
  StTable,
  StTableWrap,
  StTag,
} from "../page.styles";
import {
  DIRECTION_COLOR,
  DIRECTION_KEYS,
  DIRECTION_LABEL,
  EVENT_TYPE_COLOR,
  EVENT_TYPE_ICON,
  EVENT_TYPE_KEYS,
  EVENT_TYPE_LABEL,
  RELATION_COLOR,
  RELATION_DETAIL_PLACEHOLDER,
  RELATION_KEYS,
  RELATION_LABEL,
  type GiftDirection,
  type GiftEntry,
  type GiftEventType,
  type GiftRelation,
} from "../types";
import { formatAmount, formatSigned } from "./giftFormat";

type Filter = "all" | GiftDirection;
type RelationFilter = "all" | GiftRelation;
type ViewMode = "list" | "table" | "exchange";

const FILTERS: { key: Filter; label: string; color: string }[] = [
  { key: "all", label: "전체", color: "#3b6fd6" },
  { key: "given", label: DIRECTION_LABEL.given, color: DIRECTION_COLOR.given },
  {
    key: "received",
    label: DIRECTION_LABEL.received,
    color: DIRECTION_COLOR.received,
  },
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
  onEdit: (entry: GiftEntry) => void;
  onRemove: (id: string) => void;
  onToggleReturned: (ids: string[], returned: boolean) => void;
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
  onEdit,
  onRemove,
  onToggleReturned,
  onChangeRelationMany,
}: EntryHistoryProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [relationFilter, setRelationFilter] = useState<RelationFilter>("all");
  const [view, setView] = useState<ViewMode>("list");

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
        <StChipRow>
          <StChip
            type="button"
            $active={view === "list"}
            $color="#3b6fd6"
            onClick={() => setView("list")}
          >
            목록
          </StChip>
          <StChip
            type="button"
            $active={view === "table"}
            $color="#3b6fd6"
            onClick={() => setView("table")}
          >
            표 (종류별 명단)
          </StChip>
          <StChip
            type="button"
            $active={view === "exchange"}
            $color="#3b6fd6"
            onClick={() => setView("exchange")}
          >
            주고받음 대조
          </StChip>
        </StChipRow>
      </StCardHead>
      {view === "exchange" ? null : (
        <>
          <StChipRow>
            {FILTERS.map((item) => (
              <StChip
                key={item.key}
                type="button"
                $active={filter === item.key}
                $color={item.color}
                onClick={() => setFilter(item.key)}
              >
                {item.label}
              </StChip>
            ))}
          </StChipRow>
          <StChipRow>
            <StChip
              type="button"
              $active={relationFilter === "all"}
              $color="#3b6fd6"
              onClick={() => setRelationFilter("all")}
            >
              관계 전체
            </StChip>
            {RELATION_KEYS.map((key) => (
              <StChip
                key={key}
                type="button"
                $active={relationFilter === key}
                $color={RELATION_COLOR[key]}
                onClick={() => setRelationFilter(key)}
              >
                {RELATION_LABEL[key]}
              </StChip>
            ))}
          </StChipRow>
        </>
      )}

      {view === "exchange" ? (
        <ExchangeTable entries={entries} onToggleReturned={onToggleReturned} />
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
                    $color={RELATION_COLOR[key]}
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
                      $color={RELATION_COLOR[bulkRelation]}
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
                  <StTag $color={DIRECTION_COLOR[group.direction]}>
                    {DIRECTION_LABEL[group.direction]}
                  </StTag>
                </StGroupTitle>
                <StGroupMeta>
                  {group.entries.length}명 · {formatAmount(group.total)}
                </StGroupMeta>
              </StGroupHead>
              <StTableWrap>
                <StTable>
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
                      <th aria-label="동작" />
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
                        <td>
                          <b>{entry.personName}</b>
                        </td>
                        <td>{relationText(entry)}</td>
                        <td
                          className="amount"
                          style={{ color: DIRECTION_COLOR[entry.direction] }}
                        >
                          {formatAmount(entry.amount)}
                        </td>
                        <td>{entry.date}</td>
                        <td className="memo">{entry.memo}</td>
                        <td>
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
          {visible.map((entry) => (
            <StRecordRow key={entry.id}>
              <StRecordMain>
                <StRecordTop>
                  <StRecordDate>{entry.date}</StRecordDate>
                  <StTag $color={EVENT_TYPE_COLOR[entry.eventType]}>
                    {EVENT_TYPE_ICON[entry.eventType]}{" "}
                    {EVENT_TYPE_LABEL[entry.eventType]}
                  </StTag>
                  <StTag $color={RELATION_COLOR[entry.relation]}>
                    {relationText(entry)}
                  </StTag>
                </StRecordTop>
                <StRecordTop>
                  <StRecordName>{entry.personName}</StRecordName>
                  <StRecordAmount $color={DIRECTION_COLOR[entry.direction]}>
                    {formatSigned(entry.amount, entry.direction)}
                  </StRecordAmount>
                </StRecordTop>
                {entry.memo ? <StRecordMemo>{entry.memo}</StRecordMemo> : null}
              </StRecordMain>
              <StRecordActions>
                <StEditBtn type="button" onClick={() => onEdit(entry)}>
                  수정
                </StEditBtn>
                <StDelBtn type="button" onClick={() => onRemove(entry.id)}>
                  삭제
                </StDelBtn>
              </StRecordActions>
            </StRecordRow>
          ))}
        </StRecordList>
      )}
    </StCard>
  );
}
