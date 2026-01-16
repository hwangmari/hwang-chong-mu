// app/portfolio/campaigns/constants.ts

export interface CampaignItem {
  id: string;
  date: string;
  title: string;
  url: string; // 링크가 없으면 빈 문자열 ""
}

export const CAMPAIGN_LIST: CampaignItem[] = [
  // 2020
  {
    id: "2020-03",
    date: "2020.02.28",
    title: "필립스",
    url: "https://media.29cm.co.kr/campaign/lattego/",
  },
  {
    id: "2020-02",
    date: "2020.02.24",
    title: "SK브로드밴드",
    url: "https://media.29cm.co.kr/campaign/tworld/",
  },
  {
    id: "2020-01",
    date: "2020.02.03",
    title: "질레트",
    url: "https://media.29cm.co.kr/campaign/gillettelabs/",
  },

  // 2019
  {
    id: "2019-10",
    date: "2019.09.23",
    title: "챕스틱",
    url: "https://media.29cm.co.kr/campaign/chapstick/",
  },
  {
    id: "2019-09",
    date: "2019.08.26",
    title: "리스테린",
    url: "https://media.29cm.co.kr/campaign/colorfullisterine/",
  },
  {
    id: "2019-08",
    date: "2019.08.05",
    title: "삼성화재 2차",
    url: "https://media.29cm.co.kr/campaign/trip2.samsung/",
  },
  {
    id: "2019-07",
    date: "2019.07.08",
    title: "삼성화재 1차",
    url: "https://media.29cm.co.kr/campaign/trip1.samsung/",
  },
  {
    id: "2019-06",
    date: "2019.05.14",
    title: "바른생각",
    url: "https://media.29cm.co.kr/campaign/barunsengkak/",
  },
  {
    id: "2019-05",
    date: "2019.04.05",
    title: "해브어굿타임",
    url: "https://media.29cm.co.kr/campaign/haveagoodtime/",
  },
  {
    id: "2019-04",
    date: "2019.03.15",
    title: "우주비행",
    url: "https://media.29cm.co.kr/campaign/wybh/",
  },
  {
    id: "2019-03",
    date: "2019.03.11",
    title: "오소이",
    url: "https://media.29cm.co.kr/campaign/osoi/",
  },
  {
    id: "2019-02",
    date: "2019.02.21",
    title: "휘슬러",
    url: "https://media.29cm.co.kr/campaign/fisslercitycollection/",
  },
  {
    id: "2019-01",
    date: "2019.02.02",
    title: "이스트팩",
    url: "https://media.29cm.co.kr/campaign/eastpak19ss/",
  },

  // 2018
  {
    id: "2018-16",
    date: "2018.12.06",
    title: "메종마레",
    url: "https://media.29cm.co.kr/campaign/maisonmarais/",
  },
  {
    id: "2018-15",
    date: "2018.11.14",
    title: "구례베이커리",
    url: "https://media.29cm.co.kr/campaign/GuryeBakery/",
  },
  {
    id: "2018-14",
    date: "2018.11.09",
    title: "비아플레인 어썸니즈",
    url: "https://media.29cm.co.kr/campaign/via-awesome/",
  },
  {
    id: "2018-13",
    date: "2018.10.30",
    title: "CK Performance",
    url: "https://media.29cm.co.kr/campaign/ckPerformance/",
  },
  {
    id: "2018-12",
    date: "2018.09.21",
    title: "시티리포터 대만",
    url: "https://media.29cm.co.kr/campaign/via-awesome/",
  },
  {
    id: "2018-11",
    date: "2018.08.03",
    title: "이스트백",
    url: "https://media.29cm.co.kr/campaign/eastpak/",
  },
  {
    id: "2018-10",
    date: "2018.07.13",
    title: "크룬",
    url: "https://media.29cm.co.kr/campaign/croon/",
  },
  {
    id: "2018-09",
    date: "2018.06.07",
    title: "에스프레소 마티니",
    url: "https://media.29cm.co.kr/campaign/espressomartini/index.html",
  },
  {
    id: "2018-08",
    date: "2018.04.27",
    title: "로서울 유지",
    url: "https://media.29cm.co.kr/campaign/29cm-acc/",
  },
  {
    id: "2018-07",
    date: "2018.04.11",
    title: "로나제인",
    url: "https://media.29cm.co.kr/campaign/lornajane/",
  },
  {
    id: "2018-06",
    date: "2018.03.28",
    title: "라라스윗",
    url: "https://media.29cm.co.kr/campaign/lalasweet/",
  },
  {
    id: "2018-05",
    date: "2018.03.14",
    title: "TOMS",
    url: "https://media.29cm.co.kr/campaign/toms/",
  },
  {
    id: "2018-04",
    date: "2018.02.28",
    title: "벨리에",
    url: "https://media.29cm.co.kr/campaign/belier/",
  },
  {
    id: "2018-03",
    date: "2018.01.31",
    title: "도교샌드위치",
    url: "https://media.29cm.co.kr/campaign/29cmtour/01/",
  },
  {
    id: "2018-02",
    date: "2018.01.15",
    title: "프라이탁 episode2",
    url: "https://media.29cm.co.kr/campaign/freitag/episode2.html",
  },
  {
    id: "2018-01",
    date: "2018.01.15",
    title: "프라이탁 episode1",
    url: "https://media.29cm.co.kr/campaign/freitag/episode1.html",
  },

  // 2017
  {
    id: "2017-13",
    date: "2017.12.26",
    title: "시티리포터 핀란드 헬싱키",
    url: "",
  },
  {
    id: "2017-12",
    date: "2017.12.22",
    title: "동물자유연대",
    url: "https://media.29cm.co.kr/campaign/petguide/",
  },
  {
    id: "2017-11",
    date: "2017.12.21",
    title: "LEXUS episode3",
    url: "https://media.29cm.co.kr/campaign/lexus/episode3.html",
  },
  {
    id: "2017-10",
    date: "2017.12.21",
    title: "LEXUS episode2",
    url: "https://media.29cm.co.kr/campaign/lexus/episode2.html",
  },
  {
    id: "2017-09",
    date: "2017.12.21",
    title: "LEXUS episode1",
    url: "https://media.29cm.co.kr/campaign/lexus/episode1.html",
  },
  { id: "2017-08", date: "2017.11.20", title: "시티리포터 방콕", url: "" },
  {
    id: "2017-07",
    date: "2017.10.27",
    title: "Hollys Coffee",
    url: "https://media.29cm.co.kr/campaign/hollys/",
  },
  { id: "2017-06", date: "2017.10.19", title: "시티리포터 포틀랜드", url: "" },
  {
    id: "2017-05",
    date: "2017.10.10",
    title: "Low Classic",
    url: "https://media.29cm.co.kr/campaign/lowclassic/",
  },
  {
    id: "2017-04",
    date: "2017.09.20",
    title: "CK UNDERWEAR",
    url: "https://media.29cm.co.kr/campaign/ck/",
  },
  {
    id: "2017-03",
    date: "2017.08.17",
    title: "PUMA episode2",
    url: "https://pt.29cm.co.kr/puma/episode2/",
  },
  {
    id: "2017-02",
    date: "2017.08.08",
    title: "PUMA episode1",
    url: "https://pt.29cm.co.kr/puma/episode1/",
  },
  { id: "2017-01", date: "2017.07.28", title: "THULE", url: "" },
];
