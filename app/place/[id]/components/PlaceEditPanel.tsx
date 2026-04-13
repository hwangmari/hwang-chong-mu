"use client";

import { useState } from "react";
import { Button, Input } from "@hwangchongmu/ui";
import { DinnerPlace, NaverLocalItem } from "@/types/dinner";
import {
  StCurrentPlaceItem,
  StCurrentPlaces,
  StDeleteButton,
  StEditPanel,
  StSearchResultInfo,
  StSearchResultItem,
  StSearchResultList,
  StSearchResultMeta,
  StSearchResultName,
  StSearchRow,
  StSubTitle,
} from "../page.styles";

const stripHtml = (str: string) => str.replace(/<[^>]*>/g, "");

interface PlaceEditPanelProps {
  places: DinnerPlace[];
  onAddPlace: (item: NaverLocalItem) => Promise<boolean>;
  onDeletePlace: (placeId: string) => Promise<void>;
}

export default function PlaceEditPanel({
  places,
  onAddPlace,
  onDeletePlace,
}: PlaceEditPanelProps) {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<NaverLocalItem[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `/api/naver-search?query=${encodeURIComponent(searchKeyword)}`,
      );
      const data = await res.json();
      setSearchResults(data.items || []);
    } catch {
      alert("검색에 실패했습니다.");
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (item: NaverLocalItem) => {
    const ok = await onAddPlace(item);
    if (ok) {
      setSearchResults((prev) => prev.filter((r) => r.title !== item.title));
    }
  };

  return (
    <StEditPanel>
      <StSearchRow>
        <Input
          placeholder="예) 강남 맛집, 홍대 고기집"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
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

      {searchResults.length > 0 && (
        <StSearchResultList>
          {searchResults.map((item, i) => (
            <StSearchResultItem key={i}>
              <StSearchResultInfo>
                <StSearchResultName>{stripHtml(item.title)}</StSearchResultName>
                <StSearchResultMeta>
                  {item.category} · {item.roadAddress || item.address}
                </StSearchResultMeta>
              </StSearchResultInfo>
              <Button
                color="primary"
                variant="weak"
                size="small"
                onClick={() => handleAdd(item)}
              >
                추가
              </Button>
            </StSearchResultItem>
          ))}
        </StSearchResultList>
      )}

      {places.length > 0 && (
        <StCurrentPlaces>
          <StSubTitle>현재 후보 ({places.length}곳)</StSubTitle>
          {places.map((place) => (
            <StCurrentPlaceItem key={place.id}>
              <span>{place.name}</span>
              <StDeleteButton onClick={() => onDeletePlace(place.id)}>
                삭제
              </StDeleteButton>
            </StCurrentPlaceItem>
          ))}
        </StCurrentPlaces>
      )}
    </StEditPanel>
  );
}
