"use client";

// 포트폴리오 안에서 "지금 보는 것"을 여러 컴포넌트가 함께 알기 위한 통로.
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** 위에 붙어 따라오는 리본에 가리지 않도록 스크롤할 때 띄우는 여백 */
export const STICKY_OFFSET_PX = 112;

interface PortfolioStateValue {
  /** 마우스/키보드로 지금 가리키고 있는 회사 */
  focused: string | null;
  setFocused: (id: string | null) => void;
  /** 스크롤해서 지금 화면에 보이는 회사 */
  scrollFocused: string | null;
  setScrollFocused: (id: string | null) => void;
  /** 경력 섹션이 화면에 있는지 */
  careerInView: boolean;
  setCareerInView: (v: boolean) => void;
  /** 첫 화면의 리본이 아직 보이는지 */
  heroRibbonVisible: boolean;
  setHeroRibbonVisible: (v: boolean) => void;
  /** 토이 프로젝트 카드처럼 펼쳤다 접었다 하는 것들 */
  isOpen: (key: string) => boolean;
  toggleOpen: (key: string) => void;
  /** 해당 회사 카드로 부드럽게 이동 */
  scrollToCompany: (id: string) => void;
}

const PortfolioStateContext = createContext<PortfolioStateValue>({
  focused: null,
  setFocused: () => {},
  scrollFocused: null,
  setScrollFocused: () => {},
  careerInView: false,
  setCareerInView: () => {},
  heroRibbonVisible: true,
  setHeroRibbonVisible: () => {},
  isOpen: () => false,
  toggleOpen: () => {},
  scrollToCompany: () => {},
});

export function CareerFocusProvider({ children }: { children: ReactNode }) {
  const [focused, setFocused] = useState<string | null>(null);
  const [scrollFocused, setScrollFocused] = useState<string | null>(null);
  const [careerInView, setCareerInView] = useState(false);
  const [heroRibbonVisible, setHeroRibbonVisible] = useState(true);
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => new Set<string>());

  const isOpen = useCallback((key: string) => openIds.has(key), [openIds]);

  const toggleOpen = useCallback((key: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const scrollToCompany = useCallback((id: string) => {
    setFocused(id);
    if (typeof document === "undefined") return;
    const target = document.getElementById(`career-${id}`);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - STICKY_OFFSET_PX;
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  const value = useMemo(
    () => ({
      focused,
      setFocused,
      scrollFocused,
      setScrollFocused,
      careerInView,
      setCareerInView,
      heroRibbonVisible,
      setHeroRibbonVisible,
      isOpen,
      toggleOpen,
      scrollToCompany,
    }),
    [focused, scrollFocused, careerInView, heroRibbonVisible, isOpen, toggleOpen, scrollToCompany],
  );

  return <PortfolioStateContext.Provider value={value}>{children}</PortfolioStateContext.Provider>;
}

export function useCareerFocus() {
  return useContext(PortfolioStateContext);
}
