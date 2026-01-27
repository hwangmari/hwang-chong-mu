// components/project/ProjectVisuals.tsx
"use client";
import styled from "styled-components";

export default function LogicFlowChart() {
  return (
    <Container>
      <Title>⚡ Logic Architecture</Title>

      <ScrollWrapper>
        <ChartArea>
          {/* 1. 시작 및 초기화 */}
          <NodeGroup>
            <NodeCircle>
              <Icon>🚀</Icon>
              <Label>서비스 접속</Label>
            </NodeCircle>
            <Arrow>➔</Arrow>
            <NodeRect>
              <Icon>📅</Icon>
              <Label>3주 캘린더 생성</Label>
            </NodeRect>
            <Arrow>➔</Arrow>
          </NodeGroup>

          {/* 2. 입력 및 로직 (Loop의 타겟 지점) */}
          <NodeGroup className="relative-group">
            {/* Loop 연결선이 돌아오는 지점 표시 */}
            <LoopTargetBadge>Return Point</LoopTargetBadge>

            <NodeRect $active>
              <Icon>🚫</Icon>
              <Label>불가능 날짜 선택</Label>
            </NodeRect>
            <Arrow>➔</Arrow>
            <NodeRect $dashed>
              <Icon>⚙️</Icon>
              <Label>소거 연산 수행</Label>
              <SubLabel>Negative Selection</SubLabel>
            </NodeRect>
            <Arrow>➔</Arrow>
          </NodeGroup>

          {/* 3. 조건 분기 (Decision) */}
          <BranchContainer>
            <DiamondWrapper>
              <DiamondShape />
              <DiamondLabel>
                교집합
                <br />
                존재?
              </DiamondLabel>
            </DiamondWrapper>

            {/* 분기점들 */}
            <Paths>
              {/* YES 경로 (성공) */}
              <PathRow>
                <PathLabel $type="success">Yes</PathLabel>
                <Arrow>➔</Arrow>
                <NodeRect $success>
                  <Icon>✅</Icon>
                  <Label>최적일 도출</Label>
                </NodeRect>
                <Arrow>➔</Arrow>
                <NodeCircle $end>
                  <Icon>💌</Icon>
                  <Label>초대장 공유</Label>
                </NodeCircle>
              </PathRow>

              {/* NO 경로 (실패/루프) */}
              <PathRow>
                <PathLabel $type="fail">No</PathLabel>
                <Arrow className="down-arrow">↴</Arrow>
                <NodeRect $fail>
                  <Icon>🔄</Icon>
                  <Label>조건 완화 UI</Label>
                </NodeRect>
                <LoopLine>
                  <span>⇠ Retry (Back to Input)</span>
                </LoopLine>
              </PathRow>
            </Paths>
          </BranchContainer>
        </ChartArea>
      </ScrollWrapper>
    </Container>
  );
}

// --- 2. 업데이트 히스토리 (타임라인) ---
export const DevLog = ({
  logs,
}: {
  logs: { ver: string; date: string; content: string }[];
}) => {
  return (
    <LogWrapper>
      <div className="log-title">🚀 Update History</div>
      <ul className="log-list">
        {logs.map((log, index) => (
          <li key={index}>
            <span className="version">{log.ver}</span>
            <span className="date">{log.date}</span>
            <span className="content">{log.content}</span>
          </li>
        ))}
      </ul>
    </LogWrapper>
  );
};

// --- Interfaces for Styled Components ---
interface NodeProps {
  $active?: boolean;
  $dashed?: boolean;
  $success?: boolean;
  $fail?: boolean;
  $end?: boolean;
}

interface PathLabelProps {
  $type: "success" | "fail";
}

// --- Styled Components ---

const Container = styled.div`
  width: 100%;
  background-color: ${({ theme }) => theme.colors?.gray50 || "#F8F9FA"};
  border: 1px solid ${({ theme }) => theme.colors?.gray200 || "#E9ECEF"};
  border-radius: 16px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  box-sizing: border-box;
`;

const Title = styled.h3`
  font-size: 0.875rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors?.gray600 || "#868E96"};
  margin-bottom: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ScrollWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  padding-bottom: 1rem;

  /* 스크롤바 커스텀 */
  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ced4da;
    border-radius: 3px;
  }
`;

const ChartArea = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  min-width: max-content; /* 내용이 많으면 가로로 늘어남 */
  padding: 0 1rem;
`;

const NodeGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  height: 80px; /* 높이 통일 */

  &.relative-group {
    /* Loop Target 위치 잡기 위함 */
  }
`;

const Arrow = styled.div`
  color: ${({ theme }) => theme.colors?.gray400 || "#ADB5BD"};
  font-size: 1.2rem;
  font-weight: 300;

  &.down-arrow {
    transform: rotate(90deg);
    margin: 0 0.5rem;
  }
`;

// --- Nodes Shapes ---

const NodeBase = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.8rem 1rem;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors?.gray300 || "#DEE2E6"};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors?.gray800 || "#343A40"};
  text-align: center;
  position: relative;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  }
`;

const NodeCircle = styled(NodeBase)<NodeProps>`
  border-radius: 50px; /* 타원형 */
  min-width: 100px;
  background: ${(props) => (props.$end ? "#495057" : "white")};
  color: ${(props) => (props.$end ? "white" : "inherit")};
  border-color: ${(props) => (props.$end ? "#495057" : "#DEE2E6")};
`;

const NodeRect = styled(NodeBase)<NodeProps>`
  border-radius: 8px;
  min-width: 120px;

  /* 활성화 된 입력창 스타일 */
  ${(props) =>
    props.$active &&
    `
    border-color: #4C6EF5;
    background-color: #EDF2FF;
    color: #364FC7;
  `}

  /* 점선 스타일 (소거 연산) */
  ${(props) =>
    props.$dashed &&
    `
    border-style: dashed;
    border-width: 1.5px;
    background-color: #F8F9FA;
  `}

  /* 성공 스타일 */
  ${(props) =>
    props.$success &&
    `
    border-color: #40C057;
    background-color: #EBFBEE;
    color: #2B8A3E;
  `}

  /* 실패 스타일 */
  ${(props) =>
    props.$fail &&
    `
    border-color: #FA5252;
    background-color: #FFF5F5;
    color: #C92A2A;
  `}
`;

const Icon = styled.div`
  font-size: 1.2rem;
  margin-bottom: 0.3rem;
`;

const Label = styled.span`
  line-height: 1.2;
`;

const SubLabel = styled.span`
  display: block;
  font-size: 0.65rem;
  color: #868e96;
  margin-top: 0.2rem;
  font-weight: 400;
`;

// --- Diamond (Decision) ---

const BranchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const DiamondWrapper = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DiamondShape = styled.div`
  position: absolute;
  top: 15px;
  left: 15px;
  width: 70px;
  height: 70px;
  background: white;
  border: 2px solid ${({ theme }) => theme.colors?.gray400 || "#CED4DA"};
  transform: rotate(45deg);
  z-index: 0;
`;

const DiamondLabel = styled.span`
  position: relative;
  z-index: 1;
  font-size: 0.75rem;
  font-weight: 700;
  text-align: center;
  line-height: 1.2;
  color: ${({ theme }) => theme.colors?.gray700 || "#495057"};
`;

// --- Branch Paths ---

const Paths = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem; /* Yes와 No 사이 간격 */
`;

const PathRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 60px;
`;

const PathLabel = styled.span<PathLabelProps>`
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;

  /* Yes 스타일 */
  ${(props) =>
    props.$type === "success" &&
    `
    color: #2B8A3E;
    background: #D3F9D8;
  `}

  /* No 스타일 */
  ${(props) =>
    props.$type === "fail" &&
    `
    color: #C92A2A;
    background: #FFE3E3;
  `}
`;

// --- Loop Visuals ---
const LoopLine = styled.div`
  display: flex;
  align-items: center;
  margin-left: 0.5rem;

  span {
    font-size: 0.7rem;
    color: #adb5bd;
    border-bottom: 1px dashed #adb5bd;
    padding-bottom: 2px;
  }
`;

const LoopTargetBadge = styled.div`
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #e9ecef;
  color: #868e96;
  font-size: 0.6rem;
  padding: 2px 6px;
  border-radius: 4px;
  display: none; /* 필요하면 block으로 켜서 가이드라인 표시 */
`;

const LogWrapper = styled.div`
  margin-top: 1rem;
  border-top: 1px dashed #eee;
  padding-top: 1rem;

  .log-title {
    font-size: 0.85rem;
    font-weight: 700;
    color: #666;
    margin-bottom: 0.5rem;
  }

  .log-list {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      display: flex;
      gap: 0.8rem;
      font-size: 0.85rem;
      margin-bottom: 0.4rem;
      color: #444;
      align-items: baseline;

      .version {
        font-weight: bold;
        color: #007bff; // 포인트 컬러
        min-width: 40px;
      }
      .date {
        color: #999;
        font-size: 0.8rem;
        min-width: 60px;
      }
      .content {
        flex: 1;
        line-height: 1.4;
      }
    }
  }
`;
