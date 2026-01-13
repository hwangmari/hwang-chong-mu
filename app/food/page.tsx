"use client";

import { SetStateAction, useEffect, useState } from "react";
import styled from "styled-components";
import PageIntro from "@/components/common/PageIntro";
import PlaceIcon from "@mui/icons-material/Place";
import { StContainer, StWrapper } from "@/components/styled/layout.styled";
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kakao: any;
  }
}
export default function FoodPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [places, setPlaces] = useState<any[]>([]);
  const [status, setStatus] = useState("내 위치를 찾는 중... 📡");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. 브라우저 위치 정보 요청
    if (!navigator.geolocation) {
      setStatus("브라우저가 위치 정보를 지원하지 않습니다.");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // eslint-disable-next-line react-hooks/immutability
        searchNearbyRestaurants(latitude, longitude);
      },
      (err) => {
        setStatus("위치 권한을 허용해야 주변 맛집을 찾을 수 있어요! 🥲");
        setIsLoading(false);
      }
    );
  }, []);

  const searchNearbyRestaurants = (lat: number, lng: number) => {
    // 카카오 SDK 로드 확인
    if (!window.kakao || !window.kakao.maps) {
      setStatus("지도 서비스를 불러오는 중 에러가 발생했습니다.");
      setIsLoading(false);
      return;
    }

    // 카카오 장소 검색 객체 생성
    window.kakao.maps.load(() => {
      const ps = new window.kakao.maps.services.Places();

      // 🔍 핵심: 좌표 기준 검색 (FD6=음식점 카테고리 코드)
      ps.categorySearch(
        "FD6",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data: SetStateAction<any[]>, status: any) => {
          if (status === window.kakao.maps.services.Status.OK) {
            setPlaces(data);
            setStatus("");
          } else {
            setStatus("근처 500m 내에 등록된 음식점이 없어요 😭");
          }
          setIsLoading(false);
        },
        {
          location: new window.kakao.maps.LatLng(lat, lng),
          radius: 500, // 500m 반경
          sort: window.kakao.maps.services.SortBy.DISTANCE, // 거리순 정렬
        }
      );
    });
  };

  // 카테고리 이름 깔끔하게 자르기 (예: "음식점 > 한식 > 고기" -> "고기")
  const formatCategory = (categoryName: string) => {
    const parts = categoryName.split(" > ");
    return parts.length > 1 ? parts[parts.length - 1] : parts[0];
  };

  return (
    <StContainer>
      <StWrapper>
        <PageIntro
          title="내 주변 맛집 😋"
          description="현재 위치에서 가장 가까운 식당들을 보여드려요."
        />

        <ContentArea>
          {isLoading ? (
            <LoadingMessage>{status}</LoadingMessage>
          ) : places.length > 0 ? (
            <List>
              {places.map((place) => (
                <Card key={place.id} href={place.place_url} target="_blank">
                  <CardHeader>
                    <PlaceName>{place.place_name}</PlaceName>
                    <DistanceBadge>{place.distance}m</DistanceBadge>
                  </CardHeader>

                  <CardBody>
                    <CategoryInfo>
                      <PlaceIcon style={{ fontSize: "1rem", color: "#888" }} />
                      {formatCategory(place.category_name)}
                    </CategoryInfo>
                    <Address>
                      {place.road_address_name || place.address_name}
                    </Address>
                    {place.phone && <Phone>📞 {place.phone}</Phone>}
                  </CardBody>

                  <ActionText>상세보기 &gt;</ActionText>
                </Card>
              ))}
            </List>
          ) : (
            <EmptyState>{status}</EmptyState>
          )}
        </ContentArea>
      </StWrapper>
    </StContainer>
  );
}

const ContentArea = styled.div`
  padding: 0 1.25rem;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Card = styled.a`
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  text-decoration: none;
  border: 1px solid #f0f0f0;
  transition: all 0.2s ease-in-out;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    border-color: ${({ theme }) => theme.colors?.blue100 || "#e3f2fd"};
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
`;

const PlaceName = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.4;
`;

const DistanceBadge = styled.span`
  background-color: #ff6b6b;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 99px;
  white-space: nowrap;
  margin-left: 0.5rem;
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const CategoryInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
`;

const Address = styled.p`
  font-size: 0.875rem;
  color: #888;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Phone = styled.p`
  font-size: 0.8125rem;
  color: #999;
  margin: 0.2rem 0 0 0;
`;

const ActionText = styled.div`
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #3b82f6;
  font-weight: 600;
  text-align: right;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem 0;
  color: #666;
  font-size: 1rem;
`;

const EmptyState = styled(LoadingMessage)`
  color: #999;
`;
