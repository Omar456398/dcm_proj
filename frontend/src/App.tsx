import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import AppointmentsPage from './pages/AppointmentsPage';
import AppointmentViewerPage from './pages/AppointmentViewerPage';
import CreateAppointmentPage from './pages/CreateAppointmentPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRouter() {
  const { activePage, pageFadeState } = useNavigation();

  return (
    <div
      className={`w-full page-container ${
        pageFadeState === 'visible' ? 'page-visible' : 'page-hidden'
      }`}
    >
      {activePage === 'list' ? (
        <AppointmentsPage />
      ) : activePage === 'viewer' ? (
        <AppointmentViewerPage />
      ) : (
        <CreateAppointmentPage />
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationProvider>
        <AppRouter />
      </NavigationProvider>
    </QueryClientProvider>
  );
}

export default App;
