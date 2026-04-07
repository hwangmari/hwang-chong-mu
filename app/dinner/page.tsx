"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Button, Input } from "@hwangchongmu/ui";
import PageIntro, { StHighlight } from "@/components/common/PageIntro";
import {
  StContainer,
  StWrapper,
  StSection,
} from "@/components/styled/layout.styled";
import { NaverLocalItem } from "@/types/dinner";
import { createDinnerRoom, addDinnerPlaces } from "@/services/dinner";

export default function DinnerPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<NaverLocalItem[]>([]);
  const [selected, setSelected] = useState<NaverLocalItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `/api/naver-search?query=${encodeURIComponent(keyword)}`,
      );
      const data = await res.json();
      setResults(data.items || []);
    } catch {
      alert("검색에 실패했습니다.");
    } finally {
      setSearching(false);
    }
  };

  const toggleSelect = (item: NaverLocalItem) => {
    const exists = selected.find((s) => s.title === item.title);
    if (exists) {
      setSelected(selected.filter((s) => s.title !== item.title));
    } else {
      setSelected([...selected, item]);
    }
  };

  const isSelected = (item: NaverLocalItem) =>
    selected.some((s) => s.title === item.title);

  const stripHtml = (str: string) => str.replace(/<[^>]*>/g, "");

  const handleCreate = async () => {
    if (!title.trim()) {
      alert("투표 제목을 입력해주세요!");
      return;
    }
    if (selected.length < 2) {
      alert("최소 2곳 이상 선택해주세요!");
      return;
    }
    setCreating(true);
    try {
      const room = await createDinnerRoom(title, keyword);
      const places = selected.map((s) => ({
        name: stripHtml(s.title),
        category: s.category,
        address: s.address,
        road_address: s.roadAddress,
        link: s.link,
        map_x: s.mapx,
        map_y: s.mapy,
      }));
      await addDinnerPlaces(room.id, places);
      router.push(`/dinner/${room.id}`);
    } catch {
      alert("방 생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <StContainer>
      <StWrapper>
        <PageIntro
          icon="🍻"
          title="황총무의 회식 장소 투표"
          description={
            <>
              네이버에서 맛집을 검색하고{" "}
              <StHighlight $color="blue">후보를 골라</StHighlight> 투표를
              받아보세요!
            </>
          }
        />

        {/* 투표 제목 */}
        <StSection>
          <StSectionTitle>투표 만들기</StSectionTitle>
          <Input
            label="투표 제목"
            placeholder="예) 4월 팀 회식 장소 투표"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </StSection>

        {/* 네이버 검색 */}
        <StSection>
          <StSectionTitle>장소 검색</StSectionTitle>
          <StSearchRow>
            <Input
              placeholder="예) 강남 맛집, 홍대 고기집"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button
              color="primary"
              size="medium"
              onClick={handleSearch}
              loading={searching}
            >
              검색
            </Button>
          </StSearchRow>

          {/* 검색 결과 */}
          {results.length > 0 && (
            <StResultList>
              {results.map((item, i) => (
                <StResultItem
                  key={i}
                  $selected={isSelected(item)}
                  onClick={() => toggleSelect(item)}
                >
                  <StCheckbox $checked={isSelected(item)}>
                    {isSelected(item) ? "✓" : ""}
                  </StCheckbox>
                  <StResultInfo>
                    <StPlaceName>{stripHtml(item.title)}</StPlaceName>
                    <StPlaceCategory>{item.category}</StPlaceCategory>
                    <StPlaceAddress>{item.roadAddress || item.address}</StPlaceAddress>
                    {item.telephone && (
                      <StPlacePhone>{item.telephone}</StPlacePhone>
                    )}
                    <StMapLink
                      href={`https://map.naver.com/v5/search/${encodeURIComponent(stripHtml(item.title) + " " + (item.roadAddress || item.address).split(" ").slice(0, 3).join(" "))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      네이버 지도에서 보기 →
                    </StMapLink>
                  </StResultInfo>
                </StResultItem>
              ))}
            </StResultList>
          )}
        </StSection>

        {/* 선택된 후보 */}
        {selected.length > 0 && (
          <StSection>
            <StSectionTitle>
              선택된 후보 <StBadge>{selected.length}곳</StBadge>
            </StSectionTitle>
            <StSelectedList>
              {selected.map((item, i) => (
                <StSelectedChip key={i}>
                  <span>{stripHtml(item.title)}</span>
                  <StRemoveButton onClick={() => toggleSelect(item)}>
                    ✕
                  </StRemoveButton>
                </StSelectedChip>
              ))}
            </StSelectedList>
            <Button
              color="primary"
              display="full"
              size="large"
              onClick={handleCreate}
              loading={creating}
              disabled={selected.length < 2}
            >
              투표 만들기
            </Button>
          </StSection>
        )}
      </StWrapper>
    </StContainer>
  );
}

const StSectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray800};
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StSearchRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
  margin-bottom: 1rem;

  & > div {
    flex: 1;
  }
`;

const StResultList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StResultItem = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1.5px solid
    ${({ $selected, theme }) =>
      $selected ? theme.colors.blue500 : theme.colors.gray100};
  background: ${({ $selected, theme }) =>
    $selected ? theme.colors.blue50 : theme.colors.white};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.blue200};
  }
`;

const StCheckbox = styled.div<{ $checked: boolean }>`
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.375rem;
  border: 2px solid
    ${({ $checked, theme }) =>
      $checked ? theme.colors.blue500 : theme.colors.gray300};
  background: ${({ $checked, theme }) =>
    $checked ? theme.colors.blue500 : theme.colors.white};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 2px;
`;

const StResultInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const StPlaceName = styled.div`
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.15rem;
`;

const StPlaceCategory = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.blue500};
  margin-bottom: 0.15rem;
`;

const StPlaceAddress = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.gray400};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StPlacePhone = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.gray500};
  margin-top: 0.1rem;
`;

const StMapLink = styled.a`
  display: inline-block;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.green600};
  font-weight: 600;
  text-decoration: none;
  margin-top: 0.35rem;

  &:hover {
    text-decoration: underline;
  }
`;

const StSelectedList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const StSelectedChip = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  border-radius: 9999px;
  background: ${({ theme }) => theme.colors.blue50};
  border: 1px solid ${({ theme }) => theme.colors.blue200};
  color: ${({ theme }) => theme.colors.blue600};
  font-size: 0.85rem;
  font-weight: 600;
`;

const StRemoveButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.blue500};
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
  line-height: 1;

  &:hover {
    color: ${({ theme }) => theme.colors.rose600};
  }
`;

const StBadge = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  background: ${({ theme }) => theme.colors.blue500};
  color: white;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
`;
