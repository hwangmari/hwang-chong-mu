import styled from "styled-components";

export const StRow = styled.div<{ $cols?: number }>`
  display: grid;
  grid-template-columns: repeat(
    ${({ $cols = 2 }) => $cols},
    minmax(0, 1fr)
  );
  gap: 0.7rem;

  @media (max-width: 360px) {
    gap: 0.5rem;
  }
`;

export const StLabel = styled.label`
  display: grid;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray600};
`;

export const StInput = styled.input`
  width: 100%;
  min-width: 0;
  height: 2.75rem;
  box-sizing: border-box;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.7rem;
  background: ${({ theme }) => theme.colors.white};
  padding: 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray900};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.blue500};
    box-shadow: 0 0 0 3px rgba(79, 124, 255, 0.12);
  }

  &[type="date"] {
    -webkit-appearance: none;
    appearance: none;
    text-align: left;
  }

  &[type="date"]::-webkit-date-and-time-value {
    text-align: left;
  }
`;

export const StSelect = styled.select`
  width: 100%;
  min-width: 0;
  height: 2.75rem;
  box-sizing: border-box;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.7rem;
  background: ${({ theme }) => theme.colors.white};
  padding: 0 2rem 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray900};
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3e%3cpath d='M1 1l4 4 4-4' stroke='%237d8593' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.7rem center;

  @media (max-width: 360px) {
    padding: 0 1.8rem 0 0.5rem;
    background-position: right 0.5rem center;
  }
`;

export const StTextarea = styled.textarea`
  width: 100%;
  min-width: 0;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.7rem;
  padding: 0.6rem 0.75rem;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  color: ${({ theme }) => theme.colors.gray900};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.blue500};
  }
`;

export const StPaceHint = styled.p`
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.gray500};

  b {
    color: ${({ theme }) => theme.colors.blue600};
    font-weight: 800;
  }
`;

export const StCardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
`;

export const StOcrButton = styled.button`
  align-self: flex-start;
  border: 1px dashed ${({ theme }) => theme.colors.blue200};
  background: ${({ theme }) => theme.colors.blue50};
  color: ${({ theme }) => theme.colors.blue600};
  font-size: 0.84rem;
  font-weight: 800;
  padding: 0.65rem 1rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.blue100};
    border-color: ${({ theme }) => theme.colors.blue500};
  }

  &:disabled {
    opacity: 0.7;
    cursor: progress;
  }
`;

export const StOcrSuccess = styled.p`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.green600};
  background: ${({ theme }) => theme.colors.green50};
  padding: 0.5rem 0.75rem;
  border-radius: 0.55rem;
  line-height: 1.4;
`;

export const StEnvToggle = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
  padding: 0.3rem;
  background: ${({ theme }) => theme.colors.gray100};
  border-radius: 0.8rem;
`;

export const StEnvButton = styled.button<{ $active: boolean }>`
  border: none;
  border-radius: 0.6rem;
  padding: 0.65rem 0.5rem;
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.white : "transparent"};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.blue600 : theme.colors.gray500};
  box-shadow: ${({ $active }) =>
    $active ? "0 2px 8px rgba(41, 58, 92, 0.08)" : "none"};
  transition: all 0.15s;
`;

export const StIntervalsHeadHint = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray400};
  margin-left: 0.35rem;
`;

export const StIntervals = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: ${({ theme }) => theme.colors.gray50};
  border-radius: 0.8rem;
  min-width: 0;

  @media (max-width: 480px) {
    padding: 0.55rem;
  }
`;

export const StIntervalsHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.78rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray700};
  gap: 0.5rem;
  flex-wrap: wrap;
`;

export const StAddButton = styled.button`
  border: 1px dashed ${({ theme }) => theme.colors.gray300};
  background: transparent;
  color: ${({ theme }) => theme.colors.blue600};
  padding: 0.35rem 0.75rem;
  border-radius: 0.6rem;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
`;

export const StIntervalRow = styled.div<{ $indoor: boolean }>`
  display: grid;
  grid-template-columns: ${({ $indoor }) =>
    $indoor ? "1.2rem 1fr 1fr 1fr 1.4rem" : "1.2rem 1fr 1fr 1.4rem"};
  gap: 0.4rem;
  align-items: center;

  @media (max-width: 480px) {
    grid-template-columns: ${({ $indoor }) =>
      $indoor ? "1rem 1fr 1fr 1fr 1.4rem" : "1rem 1fr 1fr 1.4rem"};
    gap: 0.25rem;
  }
`;

export const StIntervalIndex = styled.span`
  font-size: 0.75rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray500};
  text-align: center;
`;

export const StMiniInput = styled.input`
  width: 100%;
  min-width: 0;
  min-height: 2.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.55rem;
  padding: 0 0.55rem;
  font-size: 1rem;
  font-weight: 600;
  background: ${({ theme }) => theme.colors.white};

  @media (max-width: 480px) {
    padding: 0 0.3rem;
  }
`;

export const StRemoveInterval = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.rose600};
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0;
  display: grid;
  place-items: center;
  flex-shrink: 0;
`;

export const StIntervalEmpty = styled.p`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray400};
`;

export const StPrimary = styled.button`
  min-height: 2.9rem;
  padding: 0 1.4rem;
  border: none;
  border-radius: 0.8rem;
  background: linear-gradient(135deg, #607de0, #4b69c8);
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;


export const StRecordList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

export const StRecordRow = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 0.8rem;
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 0.9rem;
`;

export const StRecordMain = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const StRecordTop = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const StRecordTag = styled.span`
  font-size: 0.7rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.blue600};
  background: ${({ theme }) => theme.colors.blue50};
  padding: 0.22rem 0.55rem;
  border-radius: 0.5rem;
`;

export const StEnvTag = styled.span<{ $indoor: boolean }>`
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 0.45rem;
  background: ${({ $indoor, theme }) =>
    $indoor ? theme.colors.amber50 : theme.colors.green50};
  color: ${({ $indoor, theme }) =>
    $indoor ? theme.colors.amber600 : theme.colors.green600};
`;

export const StRecordDate = styled.span`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 700;
`;

export const StRecordStats = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray700};
`;

export const StStat = styled.span`
  font-weight: 700;

  b {
    font-size: 1rem;
    font-weight: 900;
    color: ${({ theme }) => theme.colors.gray900};
  }
`;

export const StDelta = styled.span<{ $up: boolean }>`
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.2rem 0.45rem;
  border-radius: 0.45rem;
  background: ${({ $up }) => ($up ? "#fee" : "#e6f7ee")};
  color: ${({ $up }) => ($up ? "#c0304f" : "#1f8a54")};
`;

export const StIntervalToggle = styled.button`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.74rem;
  font-weight: 800;
  padding: 0.2rem 0;
  cursor: pointer;
  letter-spacing: -0.01em;

  &:hover {
    color: ${({ theme }) => theme.colors.gray700};
  }
`;

export const StIntervalToggleIcon = styled.span<{ $open: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: currentColor;
  transition: transform 0.15s;
  transform: rotate(${({ $open }) => ($open ? "90deg" : "0deg")});
`;

export const StRecordActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const StEditBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray600};
  padding: 0.35rem 0.7rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
`;

export const StDelBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.rose200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.rose600};
  padding: 0.35rem 0.7rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
`;
