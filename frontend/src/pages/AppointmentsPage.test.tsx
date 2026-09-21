import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppointmentsPage from './AppointmentsPage';
import { NavigationProvider } from '../context/NavigationContext';
import * as api from '../api/appointments';

const mockDoctors = [
  { id: 'doc-1', name: 'Dr. Alexander Wright' },
  { id: 'doc-2', name: 'Dr. Sarah Mitchell' },
];

const mockAppointments = [
  {
    id: 'appt-1',
    patientName: 'Jane Doe',
    doctorId: 'doc-1',
    startsAt: '2026-09-21T10:00:00.000Z',
    durationMinutes: 45,
    status: 'scheduled',
    doctor: { id: 'doc-1', name: 'Dr. Alexander Wright' },
    imagingStudies: [],
  },
];

function renderAppointmentsPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <NavigationProvider>
        <AppointmentsPage />
      </NavigationProvider>
    </QueryClientProvider>,
  );
}

describe('AppointmentsPage component', () => {
  beforeEach(() => {
    jest.spyOn(api, 'fetchDoctors').mockResolvedValue(mockDoctors as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders header, navigation controls, and doctor filter options', async () => {
    jest.spyOn(api, 'fetchAppointments').mockResolvedValue(mockAppointments as any);

    renderAppointmentsPage();

    expect(screen.getByText('Clinic Scheduler')).toBeInTheDocument();
    expect(screen.getByText('New Appointment')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    expect(screen.getByRole('option', { name: 'Dr. Alexander Wright' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Dr. Sarah Mitchell' })).toBeInTheDocument();
  });

  it('renders empty state when no appointments exist', async () => {
    jest.spyOn(api, 'fetchAppointments').mockResolvedValue([]);

    renderAppointmentsPage();

    await waitFor(() => {
      expect(screen.getByText('No appointments')).toBeInTheDocument();
    });
  });

  it('allows navigating between days with previous and next day buttons', async () => {
    const fetchSpy = jest.spyOn(api, 'fetchAppointments').mockResolvedValue([]);

    renderAppointmentsPage();

    const nextBtn = screen.getByLabelText('Next day');
    fireEvent.click(nextBtn);

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('filters appointments when a status button is clicked', async () => {
    const fetchSpy = jest.spyOn(api, 'fetchAppointments').mockResolvedValue([]);

    renderAppointmentsPage();

    const completedBtn = screen.getByRole('button', { name: 'Completed' });
    fireEvent.click(completedBtn);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
      }),
    );
  });
});
