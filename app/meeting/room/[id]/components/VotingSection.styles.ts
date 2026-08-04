import styled from "styled-components";

/**
 * VOTING 단계 전용 데스크톱 레이아웃.
 * - 모바일: 세로 스택 (헤더 → 안내문구 → 이름입력/버튼 → 캘린더 → 참여현황)
 * - 데스크톱: 캘린더(메인, 넓게) + 오른쪽 사이드바(안내·입력·참여현황, sticky)
 *
 * `StSidebarColumn`은 모바일에서 display:contents로 자기 자신의 박스를 없애고
 * 자식(StGuideBlock, StParticipantsBlock)을 이 컨테이너의 직속 flex 아이템으로
 * 풀어놓는다. 그래서 order 값만으로 모바일 순서(안내→캘린더→참여현황)를
 * DOM 구조와 무관하게 만들 수 있고, 데스크톱에서는 같은 래퍼가 실제 박스를
 * 갖는 flex column(=sticky 사이드바)으로 바뀌어 안내+참여현황이 한 스택으로 붙는다.
 */
export const StVotingLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: ${({ theme }) => theme.layout.narrowWidth};
  margin: 0 auto;

  @media ${({ theme }) => theme.media.desktop} {
    flex-direction: row;
    align-items: flex-start;
    gap: 30px;
    max-width: ${({ theme }) => theme.layout.maxWidth};
    margin: 0 auto;
  }
`;

export const StGuideBlock = styled.div`
  order: 1;
`;

export const StCalendarColumn = styled.div`
  order: 2;
  min-width: 0;

  @media ${({ theme }) => theme.media.desktop} {
    order: 1;
    /* 캘린더가 넓은 화면에서 과하게 커지지 않도록 편안한 폭으로 캡 */
    flex: 1 1 auto;
    max-width: 560px;
  }
`;

export const StParticipantsBlock = styled.div`
  order: 3;
`;

export const StSidebarColumn = styled.div`
  display: contents;

  @media ${({ theme }) => theme.media.desktop} {
    display: flex;
    flex-direction: column;
    gap: 20px;
    order: 2;
    /* 캘린더를 캡한 뒤 남는 폭을 사이드바가 채우도록(참여현황 넉넉하게) */
    flex: 1 1 340px;
    max-width: 440px;
    min-width: 0;
    position: sticky;
    top: 80px;
  }
`;
