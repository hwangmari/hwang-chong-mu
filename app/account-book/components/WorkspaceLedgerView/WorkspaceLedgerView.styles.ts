import styled from "styled-components";

export const StPage = styled.main`
  overscroll-behavior: none;
  min-height: 100vh;
  background: #f3f6fb;
  display: flex;
  flex-direction: column;
`;

export const StShareConfirmBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: 1.2rem;
  background: rgba(15, 23, 42, 0.34);
`;

export const StShareConfirmCard = styled.section`
  width: min(100%, 25rem);
  border-radius: 24px;
  border: 1px solid #d7e1ee;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
  padding: 1.25rem;
`;

export const StShareConfirmEyebrow = styled.p`
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #6e8ab8;
`;

export const StShareConfirmTitle = styled.h3`
  margin-top: 0.35rem;
  font-size: 1.28rem;
  font-weight: 900;
  color: #1f2937;
`;

export const StShareConfirmDescription = styled.p`
  margin-top: 0.55rem;
  font-size: 0.92rem;
  line-height: 1.6;
  color: #5f6e82;
`;

export const StShareConfirmActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  margin-top: 1rem;
`;

export const StShareGhostButton = styled.button`
  border: 1px solid #d7e1ee;
  background: #f8fafc;
  color: #5f6e82;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-size: 0.88rem;
  font-weight: 800;
`;

export const StSharePrimaryButton = styled.button`
  border: none;
  background: linear-gradient(135deg, #6d87ef, #5f73d9);
  color: #ffffff;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-size: 0.88rem;
  font-weight: 900;
  box-shadow: 0 12px 28px rgba(95, 115, 217, 0.24);
`;

export const StContentWrap = styled.div`
  padding: 1rem;
  display: grid;
  grid-template-rows: auto auto auto auto;
  gap: 0.8rem;

  @media (max-width: 1080px) {
    display: flex;
    flex-direction: column;
  }
`;
