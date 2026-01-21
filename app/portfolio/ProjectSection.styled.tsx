import styled from "styled-components";

export const StProjectSection = styled.section`
  background-color: ${({ theme }) => theme.colors.gray50};
  padding: 5rem 0;
  border-top: 1px solid ${({ theme }) => theme.colors.gray100};
`;

export const StSectionInner = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 0 1.5rem;
`;

export const StHeaderGroup = styled.div`
  margin-bottom: 3rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const StSectionTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const StCommonStackWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);

  .label {
    font-size: 0.875rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray600};
    margin-right: 0.25rem;
  }

  .badge-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
`;

export const StCoreBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray500};
  border: 1px solid ${({ theme }) => theme.colors.gray300};
`;

export const StProjectList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3rem;
`;
