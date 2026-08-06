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
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3e%3cpath d='M1 1l4 4 4-4' stroke='%237d8593' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.7rem center;
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
`;

export const StRoutineInline = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: ${({ theme }) => theme.colors.blue50};
  border: 1px solid ${({ theme }) => theme.colors.blue100};
  border-radius: 0.85rem;
`;

export const StRoutineInlineHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;

  span {
    font-size: 0.82rem;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.blue600};
  }
`;

export const StRoutineSaveBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.blue200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.blue600};
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.35rem 0.7rem;
  border-radius: 0.55rem;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.blue100};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const StRoutineEmpty = styled.p`
  font-size: 0.76rem;
  color: ${({ theme }) => theme.colors.gray500};
  line-height: 1.45;

  b {
    color: ${({ theme }) => theme.colors.blue600};
    font-weight: 800;
  }
`;

export const StRoutineList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

export const StRoutineChip = styled.div`
  display: inline-flex;
  align-items: center;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.blue200};
  border-radius: 0.55rem;
  overflow: hidden;
`;

export const StRoutineName = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.blue600};
  font-size: 0.8rem;
  font-weight: 800;
  padding: 0.4rem 0.65rem;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.blue50};
  }
`;

export const StRoutineCount = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray400};
  margin-left: 0.15rem;
`;

export const StRoutineDel = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.gray400};
  font-size: 0.78rem;
  padding: 0.4rem 0.5rem;
  cursor: pointer;
  border-left: 1px solid ${({ theme }) => theme.colors.blue100};

  &:hover {
    color: ${({ theme }) => theme.colors.rose600};
    background: ${({ theme }) => theme.colors.rose50};
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

export const StExercisesWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

export const StExerciseCard = styled.div`
  background: ${({ theme }) => theme.colors.gray50};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 0.9rem;
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-width: 0;

  @media (max-width: 480px) {
    padding: 0.65rem;
  }
`;

export const StExerciseHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;

  @media (max-width: 480px) {
    gap: 0.35rem;
  }
`;

export const StExerciseIndex = styled.span`
  font-size: 0.78rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.blue600};
  min-width: 1.4rem;
`;

export const StExerciseName = styled.input`
  flex: 1;
  min-width: 0;
  min-height: 2.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.7rem;
  padding: 0 0.75rem;
  font-size: 1rem;
  font-weight: 700;
  background: ${({ theme }) => theme.colors.white};
`;

export const StFullbodyHint = styled.p`
  font-size: 0.78rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.gray500};
  background: ${({ theme }) => theme.colors.gray50};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 0.7rem;
  padding: 0.6rem 0.75rem;
  word-break: keep-all;
`;

export const StFullbodyNote = styled.input`
  width: 100%;
  min-height: 2.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.7rem;
  padding: 0 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray700};
`;

export const StExNote = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray500};
`;

export const StRemoveButton = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.rose600};
  font-size: 0.95rem;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 0.5rem;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  display: grid;
  place-items: center;

  &:hover {
    background: ${({ theme }) => theme.colors.rose50};
  }
`;

export const StEquipmentRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.1rem 0;
`;

export const StEquipmentChip = styled.button<{ $active: boolean }>`
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.blue500 : theme.colors.gray200};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.blue50 : theme.colors.white};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.blue600 : theme.colors.gray500};
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.28rem 0.55rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.12s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.blue200};
    color: ${({ theme }) => theme.colors.blue600};
  }
`;

export const StBarChip = styled.button<{ $active: boolean }>`
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.amber500 : theme.colors.gray200};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.amber50 : theme.colors.white};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.amber600 : theme.colors.gray500};
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.28rem 0.55rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.12s;
  margin-left: auto;

  &:hover {
    border-color: ${({ theme }) => theme.colors.amber200};
    color: ${({ theme }) => theme.colors.amber600};
  }
`;

export const StSideChip = styled.button<{ $active: boolean }>`
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.indigo500 : theme.colors.gray200};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.indigo50 : theme.colors.white};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.indigo600 : theme.colors.gray500};
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.28rem 0.55rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.12s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.indigo100};
    color: ${({ theme }) => theme.colors.indigo600};
  }
`;

export const StTimeChip = styled.button<{ $active: boolean }>`
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.teal600 : theme.colors.gray200};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.teal50 : theme.colors.white};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.teal600 : theme.colors.gray500};
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.28rem 0.55rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.12s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal600};
    color: ${({ theme }) => theme.colors.teal600};
  }
`;

export const StSetHead = styled.div`
  display: grid;
  grid-template-columns: 1.6rem 1fr 1fr 1.2fr 1.8rem;
  gap: 0.4rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray400};
  padding: 0 0.1rem;

  span {
    text-align: center;
    min-width: 0;
  }

  span:nth-child(2) {
    text-align: left;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1.3rem 1fr 1fr 1.4fr 1.8rem;
    gap: 0.25rem;
  }
`;

export const StSetRow = styled.div`
  display: grid;
  grid-template-columns: 1.6rem 1fr 1fr 1.2fr 1.8rem;
  gap: 0.4rem;
  align-items: center;

  @media (max-width: 480px) {
    grid-template-columns: 1.3rem 1fr 1fr 1.4fr 1.8rem;
    gap: 0.25rem;
  }
`;

export const StMoveGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex-shrink: 0;
`;

export const StMoveBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0;
  width: 1.6rem;
  height: 1.3rem;
  border-radius: 0.25rem;
  cursor: pointer;
  line-height: 1;
  touch-action: manipulation;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.blue600};
    border-color: ${({ theme }) => theme.colors.blue200};
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    width: 1.8rem;
    height: 1.5rem;
  }
`;

export const StSetActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.1rem;
`;

export const StCloneRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.gray500};
  font-weight: 700;
`;

export const StCloneInput = styled.input`
  width: 3.2rem;
  height: 2.2rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.45rem;
  padding: 0 0.4rem;
  font-size: 0.9rem;
  font-weight: 700;
  text-align: center;
  background: ${({ theme }) => theme.colors.white};
  box-sizing: border-box;
`;

export const StCloneBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.blue200};
  background: ${({ theme }) => theme.colors.blue50};
  color: ${({ theme }) => theme.colors.blue600};
  height: 2.2rem;
  padding: 0 0.8rem;
  border-radius: 0.45rem;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.blue100};
  }
`;

export const StSetIndex = styled.span`
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
  font-weight: 700;
  background: ${({ theme }) => theme.colors.white};
  text-align: center;

  @media (max-width: 480px) {
    padding: 0 0.3rem;
  }
`;

export const StTypeSelect = styled.select`
  width: 100%;
  min-width: 0;
  min-height: 2.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.55rem;
  padding: 0 1.4rem 0 0.45rem;
  font-size: 1rem;
  font-weight: 700;
  background: ${({ theme }) => theme.colors.white};
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3e%3cpath d='M1 1l4 4 4-4' stroke='%237d8593' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.45rem center;

  @media (max-width: 480px) {
    padding: 0 1.1rem 0 0.3rem;
    background-position: right 0.3rem center;
  }
`;

export const StDropWrap = styled.div`
  margin: 0.3rem 0 0.3rem 1.8rem;
  padding: 0.5rem;
  background: ${({ theme }) => theme.colors.white};
  border: 1px dashed ${({ theme }) => theme.colors.gray200};
  border-radius: 0.55rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

export const StDropRow = styled.div`
  display: grid;
  grid-template-columns: 4rem 1fr 1fr 1.6rem;
  gap: 0.4rem;
  align-items: center;
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray500};
  font-weight: 700;
`;

export const StAddDrop = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.blue600};
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0;
  text-align: left;
  cursor: pointer;
`;

export const StAddSet = styled.button`
  border: 1px dashed ${({ theme }) => theme.colors.gray300};
  background: transparent;
  color: ${({ theme }) => theme.colors.gray600};
  height: 2.2rem;
  padding: 0 0.9rem;
  border-radius: 0.55rem;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.blue600};
    border-color: ${({ theme }) => theme.colors.blue200};
  }
`;

export const StAddExercise = styled.button`
  border: 1px dashed ${({ theme }) => theme.colors.gray300};
  background: transparent;
  color: ${({ theme }) => theme.colors.blue600};
  padding: 0.75rem;
  border-radius: 0.8rem;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.blue500};
    background: ${({ theme }) => theme.colors.blue50};
  }
`;

export const StVolumeBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.75rem 0.9rem;
  background: ${({ theme }) => theme.colors.blue50};
  border: 1px solid ${({ theme }) => theme.colors.blue100};
  border-radius: 0.75rem;
`;

export const StVolumeHelp = styled.p`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.5;

  b {
    color: ${({ theme }) => theme.colors.blue600};
    font-weight: 800;
  }
`;

export const StVolumeHint = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.gray700};
  font-weight: 700;

  b {
    color: ${({ theme }) => theme.colors.blue600};
    font-weight: 900;
    font-size: 1rem;
  }
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
  gap: 0.6rem;
`;

export const StRecordCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 0.9rem;
  overflow: hidden;
`;

export const StRecordTop = styled.div`
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.gray50};
  }
`;

export const StRecordHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const StRecordTag = styled.span`
  font-size: 0.7rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.orange500};
  background: ${({ theme }) => theme.colors.orange50};
  padding: 0.22rem 0.55rem;
  border-radius: 0.5rem;
`;

export const StRecordDate = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray400};
`;

export const StRecordMeta = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.gray600};

  b {
    color: ${({ theme }) => theme.colors.gray900};
    font-weight: 900;
  }
`;

export const StExpanded = styled.div`
  padding: 0.75rem 0.9rem 0.9rem;
  border-top: 1px dashed ${({ theme }) => theme.colors.gray200};
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: ${({ theme }) => theme.colors.gray50};
`;

export const StExRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

export const StExName = styled.div`
  font-size: 0.88rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray800};
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

export const StExEquipTag = styled.span`
  font-size: 0.65rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.blue600};
  background: ${({ theme }) => theme.colors.blue50};
  padding: 0.12rem 0.4rem;
  border-radius: 0.35rem;
`;

export const StExSideTag = styled.span`
  font-size: 0.65rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.indigo600};
  background: ${({ theme }) => theme.colors.indigo50};
  padding: 0.12rem 0.4rem;
  border-radius: 0.35rem;
`;

export const StExBarTag = styled.span`
  font-size: 0.65rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.amber600};
  background: ${({ theme }) => theme.colors.amber50};
  padding: 0.12rem 0.4rem;
  border-radius: 0.35rem;
`;

export const StPRBadge = styled.span`
  font-size: 0.68rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.amber600};
  background: ${({ theme }) => theme.colors.amber50};
  padding: 0.15rem 0.4rem;
  border-radius: 0.4rem;
`;

export const StSetList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

export const StSetChip = styled.span<{ $warm: boolean }>`
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.25rem 0.55rem;
  border-radius: 0.45rem;
  background: ${({ theme, $warm }) =>
    $warm ? theme.colors.gray100 : theme.colors.white};
  color: ${({ theme, $warm }) =>
    $warm ? theme.colors.gray500 : theme.colors.gray800};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
`;

export const StSetType = styled.em`
  font-style: normal;
  color: ${({ theme }) => theme.colors.blue600};
  font-weight: 700;
`;

export const StExpandedActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

export const StEditBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray600};
  padding: 0.35rem 0.9rem;
  border-radius: 0.5rem;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
`;

export const StDelBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.rose200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.rose600};
  padding: 0.35rem 0.9rem;
  border-radius: 0.5rem;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
`;
