import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

export type Page = 'list' | 'viewer';
export type PageFadeState = 'visible' | 'hidden';
export type DcmCardStage = 'hidden' | 'opening' | 'open' | 'closing';

interface NavigationContextValue {
  activePage: Page;
  selectedAppointmentId: string | null;
  pageFadeState: PageFadeState;
  dcmCardStage: DcmCardStage;
  isNavigating: boolean;
  hasDcm: boolean;
  setHasDcm: (hasDcm: boolean) => void;
  navigateToViewer: (appointmentId: string) => void;
  navigateToList: () => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(
  undefined,
);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const initialParams = new URLSearchParams(window.location.search);
  const initialAppointmentId = initialParams.get('appointmentId');

  const [activePage, setActivePage] = useState<Page>(
    initialAppointmentId ? 'viewer' : 'list',
  );
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(initialAppointmentId);

  // Page 0.3s fade state: 'visible' (opacity 1) or 'hidden' (opacity 0)
  const [pageFadeState, setPageFadeState] = useState<PageFadeState>('visible');

  // DCM card stage
  const [dcmCardStage, setDcmCardStage] = useState<DcmCardStage>('hidden');
  const [hasDcm, setHasDcmState] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  const hasDcmRef = useRef(hasDcm);
  hasDcmRef.current = hasDcm;

  const dcmCardStageRef = useRef(dcmCardStage);
  dcmCardStageRef.current = dcmCardStage;

  const isNavigatingRef = useRef(isNavigating);
  isNavigatingRef.current = isNavigating;

  const setHasDcm = useCallback((available: boolean) => {
    setHasDcmState(available);
  }, []);

  // Trigger DCM card open after fade-in when on viewer and hasDcm is true
  useEffect(() => {
    if (
      !isNavigating &&
      activePage === 'viewer' &&
      pageFadeState === 'visible' &&
      hasDcm &&
      dcmCardStage === 'hidden'
    ) {
      setDcmCardStage('opening');
      const timer = setTimeout(() => {
        setDcmCardStage('open');
      }, 420);
      return () => clearTimeout(timer);
    }
  }, [isNavigating, activePage, pageFadeState, hasDcm, dcmCardStage]);

  // Navigate to Viewer:
  // 1. Current page fadeout (0.3s)
  // 2. Switch component at opacity 0
  // 3. New page fadein (0.3s)
  // 4. Trigger DCM opening animation (after fadein)
  const navigateToViewer = useCallback((appointmentId: string) => {
    if (isNavigatingRef.current) return;
    setIsNavigating(true);

    // 1. Fade out current page (0.3s)
    setPageFadeState('hidden');

    setTimeout(() => {
      // 2. Switch page while completely hidden
      setActivePage('viewer');
      setSelectedAppointmentId(appointmentId);
      setDcmCardStage('hidden');
      setHasDcmState(false);

      const url = new URL(window.location.href);
      url.searchParams.set('appointmentId', appointmentId);
      window.history.pushState({ appointmentId }, '', url.toString());

      // Next frame: trigger 0.3s fade-in of the new viewer page
      setTimeout(() => {
        setPageFadeState('visible');

        // 3. Fade-in completes after 300ms
        setTimeout(() => {
          setIsNavigating(false);
        }, 300);
      }, 40);
    }, 300);
  }, []);

  // Navigate back to List:
  // 1. If DCM card is open: trigger DCM closing animation FIRST (0.3s)
  // 2. Viewer page fadeout (0.3s)
  // 3. Switch component to list at opacity 0
  // 4. List page fadein (0.3s)
  const navigateToList = useCallback(() => {
    if (isNavigatingRef.current) return;
    setIsNavigating(true);

    const performPageFadeAndSwitch = () => {
      // Step A: Fade out viewer page (0.3s)
      setPageFadeState('hidden');

      setTimeout(() => {
        // Step B: Switch to list page while completely hidden
        setActivePage('list');
        setSelectedAppointmentId(null);
        setDcmCardStage('hidden');
        setHasDcmState(false);

        const url = new URL(window.location.href);
        url.searchParams.delete('appointmentId');
        window.history.pushState({}, '', url.toString());

        // Next frame: trigger 0.3s fade-in of the list page
        setTimeout(() => {
          setPageFadeState('visible');

          // Step C: Fade-in completes after 300ms
          setTimeout(() => {
            setIsNavigating(false);
          }, 300);
        }, 40);
      }, 300);
    };

    // If DCM is currently open/opening, run closing animation before fadeout!
    if (
      hasDcmRef.current &&
      (dcmCardStageRef.current === 'open' || dcmCardStageRef.current === 'opening')
    ) {
      setDcmCardStage('closing');
      setTimeout(() => {
        setDcmCardStage('hidden');
        performPageFadeAndSwitch();
      }, 300);
    } else {
      performPageFadeAndSwitch();
    }
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const apptId = params.get('appointmentId');

      if (apptId) {
        navigateToViewer(apptId);
      } else {
        navigateToList();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigateToViewer, navigateToList]);

  return (
    <NavigationContext.Provider
      value={{
        activePage,
        selectedAppointmentId,
        pageFadeState,
        dcmCardStage,
        isNavigating,
        hasDcm,
        setHasDcm,
        navigateToViewer,
        navigateToList,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
