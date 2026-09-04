"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { Input } from "@hwangchongmu/ui";
import CreateButton from "@/components/common/CreateButton";
import PageIntro from "@/components/common/PageIntro";
import {
  StContainer,
  StPageWrapper,
  StSection,
  StSectionTitle,
  StInlineButton,
  StFlexBox,
} from "@/components/styled/layout.styled";
import FooterGuide from "@/components/common/FooterGuide";
import { DAILY_GUIDE_DATA } from "@/data/footerGuides";
import { createDailyNotebook } from "./repository";
import {
  clearLegacyDailyLocalData,
  getMonthKey,
  sanitizeChecklist,
  setStoredDailyAccessCode,
} from "./storage";
import { useModal } from "@/components/common/ModalProvider";

export default function DailyCreatePage() {
  const router = useRouter();
  const { openAlert } = useModal();
  const [title, setTitle] = useState("");
  const [items, setItems] = useState(["운동", "물 2L", "영양제"]);
  const [accessCode, setAccessCode] = useState("");
  const [openNotebookId, setOpenNotebookId] = useState("");
  const [openAccessCode, setOpenAccessCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    clearLegacyDailyLocalData();
  }, []);

  const addItem = () => setItems((prev) => [...prev, ""]);

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, current) => current !== index));
  };

  const updateItem = (index: number, value: string) => {
    setItems((prev) =>
      prev.map((item, current) => (current === index ? value : item)),
    );
  };

  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    const checklist = sanitizeChecklist(items);
    const trimmedCode = accessCode.trim();

    if (!trimmedTitle) {
      await openAlert("기록장 이름을 입력해주세요.");
      return;
    }

    if (trimmedCode.length < 4) {
      await openAlert("접근 비밀번호는 4자 이상 입력해주세요.");
      return;
    }

    setIsCreating(true);
    try {
      const notebookId = await createDailyNotebook(
        trimmedTitle,
        trimmedCode,
        getMonthKey(new Date()),
        checklist,
      );
      setStoredDailyAccessCode(notebookId, trimmedCode);
      router.push(`/daily/${notebookId}`);
    } catch (error) {
      console.error("기록장 생성 실패:", error);
      await openAlert(
        "기록장을 서버에 저장하지 못했어요. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenNotebook = async () => {
    const trimmedId = openNotebookId.trim();
    const trimmedCode = openAccessCode.trim();

    if (!trimmedId) {
      await openAlert("기록장 ID를 입력해주세요.");
      return;
    }

    if (!trimmedCode) {
      await openAlert("접근 비밀번호를 입력해주세요.");
      return;
    }

    setIsOpening(true);
    setStoredDailyAccessCode(trimmedId, trimmedCode);
    router.push(`/daily/${trimmedId}`);
  };

  return (
    <StContainer>
      <StPageWrapper>
        <PageIntro
          icon="📓"
          title="일일 기록"
          description="이제 기록은 브라우저가 아니라 서버에서 불러옵니다."
        />

        <StFlexBox>
          <div className="flex-lft-box">
            <StSection>
              <FormSection>
                <StSectionTitle>1. 기록장 이름</StSectionTitle>
                <Input
                  placeholder="예: 4월 루틴 기록장"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </FormSection>

              <FormSection>
                <StSectionTitle>2. 접근 비밀번호</StSectionTitle>
                <Input
                  type="password"
                  placeholder="4자 이상 입력해주세요"
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value)}
                />
                <HelperText>
                  서버에 암호화되어 저장되므로 이후에도 이 비밀번호가 필요해요.
                </HelperText>
              </FormSection>

              <FormSection>
                <HeaderRow>
                  <StSectionTitle>3. 체크리스트 항목</StSectionTitle>
                  <TextButton type="button" onClick={addItem}>
                    + 항목 추가
                  </TextButton>
                </HeaderRow>

                {items.map((item, index) => (
                  <ChecklistItem key={index}>
                    <ItemIndex>{index + 1}</ItemIndex>
                    <Input
                      placeholder="체크할 항목을 입력하세요"
                      value={item}
                      onChange={(event) =>
                        updateItem(index, event.target.value)
                      }
                    />
                    <DeleteButton
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={items.length <= 1}
                    >
                      삭제
                    </DeleteButton>
                  </ChecklistItem>
                ))}
              </FormSection>

              <CreateButton onClick={handleCreate} disabled={isCreating}>
                {isCreating ? "기록장 만드는 중..." : "기록장 만들기"}
              </CreateButton>
            </StSection>
          </div>

          <div className="flex-rgt-box">
            <StSection>
              <StSectionTitle>기존 기록장 열기</StSectionTitle>
              <OpenGrid>
                <Input
                  placeholder="기록장 ID"
                  value={openNotebookId}
                  onChange={(event) => setOpenNotebookId(event.target.value)}
                />
                <Input
                  type="password"
                  placeholder="접근 비밀번호"
                  value={openAccessCode}
                  onChange={(event) => setOpenAccessCode(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleOpenNotebook();
                    }
                  }}
                />
              </OpenGrid>
              <OpenButton
                type="button"
                onClick={handleOpenNotebook}
                disabled={isOpening}
              >
                기록장 열기
              </OpenButton>
            </StSection>

            <FooterGuide
              title={DAILY_GUIDE_DATA.title}
              story={DAILY_GUIDE_DATA.story}
              tips={DAILY_GUIDE_DATA.tips}
              layout="compact"
            />
          </div>
        </StFlexBox>
      </StPageWrapper>
    </StContainer>
  );
}

const FormSection = styled.section`
  margin-bottom: 1.5rem;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;

  > h2 {
    margin-bottom: 0;
  }

  margin-bottom: 0.75rem;
`;

const HelperText = styled.p`
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.semantic.subText};
  word-break: keep-all;
`;

const ChecklistItem = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.5rem;
  align-items: center;

  & + & {
    margin-top: 0.5rem;
  }
`;

const ItemIndex = styled.span`
  min-width: 1.5rem;
  color: ${({ theme }) => theme.semantic.subText};
  font-size: 0.85rem;
  font-weight: 700;
  text-align: center;
`;

const TextButton = styled.button`
  color: ${({ theme }) => theme.semantic.primary};
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
`;

const DeleteButton = styled.button`
  color: ${({ theme }) => theme.semantic.subText};
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.35rem 0.45rem;
  cursor: pointer;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.semantic.danger};
  }

  &:disabled {
    color: ${({ theme }) => theme.colors.gray300};
    cursor: not-allowed;
  }
`;

const OpenGrid = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 0.75rem;

  /* 공용 Input이 형제일 때 붙이는 상단 여백은 그리드에선 불필요 */
  > div + div {
    margin-top: 0;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const OpenButton = styled(StInlineButton)`
  width: 100%;
  margin-top: 0.75rem;
`;
