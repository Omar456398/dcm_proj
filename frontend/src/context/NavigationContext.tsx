import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

export type Page = 'list' | 'viewer' | 'create';
export type PageFadeState = 'visible' | 'hidden';
export type DcmCardStage = 'hidden' | 'opening' | 'open' | 'closing';

interface NavigationContextValue {
  activePage: Page;
  selectedAppointmentId: string | null;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  pageFadeState: PageFadeState;
  dcmCardStage: DcmCardStage;
  isNavigating: boolean;
  hasDcm: boolean;
  setHasDcm: (hasDcm: boolean) => void;
  navigateToViewer: (appointmentId: string) => void;
  navigateToCreate: () => void;
  navigateToList: (targetDate?: string) => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(
  undefined,
);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const initialParams = new URLSearchParams(window.location.search);
  const initialAppointmentId = initialParams.get('appointmentId');
  const initialView = initialParams.get('view');

  const [activePage, setActivePage] = useState<Page>(
    initialAppointmentId ? 'viewer' : initialView === 'create' ? 'create' : 'list',
  );
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(initialAppointmentId);

  // Global selected date for schedule view (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

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
  const navigateToViewer = useCallback((appointmentId: string) => {
    if (isNavigatingRef.current) return;
    setIsNavigating(true);

    setPageFadeState('hidden');

    setTimeout(() => {
      setActivePage('viewer');
      setSelectedAppointmentId(appointmentId);
      setDcmCardStage('hidden');
      setHasDcmState(false);

      const url = new URL(window.location.href);
      url.searchParams.delete('view');
      url.searchParams.set('appointmentId', appointmentId);
      window.history.pushState({ appointmentId }, '', url.toString());

      setTimeout(() => {
        setPageFadeState('visible');
        setTimeout(() => {
          setIsNavigating(false);
        }, 300);
      }, 40);
    }, 300);
  }, []);

  // Navigate to Create Appointment:
  const navigateToCreate = useCallback(() => {
    if (isNavigatingRef.current) return;
    setIsNavigating(true);

    const performFadeAndSwitch = () => {
      setPageFadeState('hidden');

      setTimeout(() => {
        setActivePage('create');
        setSelectedAppointmentId(null);
        setDcmCardStage('hidden');
        setHasDcmState(false);

        const url = new URL(window.location.href);
        url.searchParams.delete('appointmentId');
        url.searchParams.set('view', 'create');
        window.history.pushState({ view: 'create' }, '', url.toString());

        setTimeout(() => {
          setPageFadeState('visible');
          setTimeout(() => {
            setIsNavigating(false);
          }, 300);
        }, 40);
      }, 300);
    };

    if (
      hasDcmRef.current &&
      (dcmCardStageRef.current === 'open' || dcmCardStageRef.current === 'opening')
    ) {
      setDcmCardStage('closing');
      setTimeout(() => {
        setDcmCardStage('hidden');
        performFadeAndSwitch();
      }, 300);
    } else {
      performFadeAndSwitch();
    }
  }, []);

  // Navigate back to List:
  const navigateToList = useCallback((targetDate?: string) => {
    if (isNavigatingRef.current) return;
    setIsNavigating(true);

    if (targetDate) {
      setSelectedDate(targetDate);
    }

    const performPageFadeAndSwitch = () => {
      setPageFadeState('hidden');

      setTimeout(() => {
        setActivePage('list');
        setSelectedAppointmentId(null);
        setDcmCardStage('hidden');
        setHasDcmState(false);

        const url = new URL(window.location.href);
        url.searchParams.delete('appointmentId');
        url.searchParams.delete('view');
        window.history.pushState({}, '', url.toString());

        setTimeout(() => {
          setPageFadeState('visible');
          setTimeout(() => {
            setIsNavigating(false);
          }, 300);
        }, 40);
      }, 300);
    };

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
      const view = params.get('view');

      if (apptId) {
        navigateToViewer(apptId);
      } else if (view === 'create') {
        navigateToCreate();
      } else {
        navigateToList();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigateToViewer, navigateToCreate, navigateToList]);

  return (
    <NavigationContext.Provider
      value={{
        activePage,
        selectedAppointmentId,
        selectedDate,
        setSelectedDate,
        pageFadeState,
        dcmCardStage,
        isNavigating,
        hasDcm,
        setHasDcm,
        navigateToViewer,
        navigateToCreate,
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
