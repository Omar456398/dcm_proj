import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppointmentsPage from './pages/AppointmentsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppointmentsPage />
    </QueryClientProvider>
  );
}

export default App;
