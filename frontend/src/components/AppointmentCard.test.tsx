import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppointmentCard from './AppointmentCard';
import { Appointment, AppointmentStatus } from '../types/appointment';
import { NavigationProvider } from '../context/NavigationContext';
import * as api from '../api/appointments';

const mockAppointment: Appointment = {
  id: 'appt-1',
  patientName: 'Jane Doe',
  doctorId: 'doc-1',
  startsAt: '2026-09-21T10:00:00.000Z',
  durationMinutes: 60,
  status: 'scheduled' as AppointmentStatus,
  reason: 'Brain scan review',
  createdAt: '2026-09-20T10:00:00.000Z',
  updatedAt: '2026-09-20T10:00:00.000Z',
  doctor: { id: 'doc-1', name: 'Dr. Alexander Wright' },
  imagingStudies: [],
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <NavigationProvider>{ui}</NavigationProvider>
    </QueryClientProvider>,
  );
}

describe('AppointmentCard component', () => {
  it('renders patient name, doctor, reason, duration, and formatted time', () => {
    renderWithProviders(
      <AppointmentCard appointment={mockAppointment} queryKey={['appointments']} />,
    );

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Dr. Alexander Wright')).toBeInTheDocument();
    expect(screen.getByText('Brain scan review')).toBeInTheDocument();
    expect(screen.getByText('60 min')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    expect(screen.getByText('11:00 AM')).toBeInTheDocument();
  });

  it('renders status selector and triggers status update mutation on change', async () => {
    const patchSpy = jest.spyOn(api, 'patchAppointmentStatus').mockResolvedValue({
      ...mockAppointment,
      status: 'completed',
    });

    renderWithProviders(
      <AppointmentCard appointment={mockAppointment} queryKey={['appointments']} />,
    );

    const select = screen.getByLabelText(/Change status for Jane Doe/i);
    expect(select).toHaveValue('scheduled');

    fireEvent.change(select, { target: { value: 'completed' } });
    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith('appt-1', 'completed');
    });
    patchSpy.mockRestore();
  });

  it('handles left half click to open viewer', () => {
    renderWithProviders(
      <AppointmentCard appointment={mockAppointment} queryKey={['appointments']} />,
    );

    const clickableDiv = screen.getByRole('button', {
      name: /Open appointment and scan viewer for Jane Doe/i,
    });
    expect(clickableDiv).toBeInTheDocument();
    fireEvent.click(clickableDiv);
  });
});
