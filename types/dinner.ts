export interface DinnerRoom {
  id: string;
  title: string;
  area: string; // 검색 지역 키워드 (예: "강남", "홍대")
  created_at: string;
}

export interface DinnerPlace {
  id: string;
  room_id: string;
  name: string;
  category: string;
  address: string;
  road_address: string;
  link: string;
  map_x: string;
  map_y: string;
}

export interface DinnerVote {
  id: string;
  room_id: string;
  place_id: string;
  voter_name: string;
  created_at: string;
}

// 네이버 지역 검색 API 응답 아이템
export interface NaverLocalItem {
  title: string;
  link: string;
  category: string;
  description: string;
  telephone: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
}
