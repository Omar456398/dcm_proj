import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateAppointmentPage from './CreateAppointmentPage';
import { NavigationProvider } from '../context/NavigationContext';
import * as api from '../api/appointments';

const mockDoctors = [
  { id: 'doc-1', name: 'Dr. Alexander Wright' },
  { id: 'doc-2', name: 'Dr. Sarah Mitchell' },
];

function renderCreatePage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <NavigationProvider>
        <CreateAppointmentPage />
      </NavigationProvider>
    </QueryClientProvider>,
  );
}

describe('CreateAppointmentPage component', () => {
  beforeEach(() => {
    jest.spyOn(api, 'fetchDoctors').mockResolvedValue(mockDoctors as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders form inputs and loads doctors', async () => {
    renderCreatePage();

    expect(screen.getByText('Book New Appointment')).toBeInTheDocument();
    expect(screen.getByLabelText(/Patient Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Start Time/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText(/Assigned Doctor/i)).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Dr. Alexander Wright' })).toBeInTheDocument();
    });
  });

  it('shows validation errors when required fields are missing', async () => {
    renderCreatePage();

    const submitBtn = screen.getByRole('button', { name: /Schedule Appointment/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Patient name is required')).toBeInTheDocument();
    });
  });

  it('submits form with valid data and calls createAppointment', async () => {
    const createSpy = jest.spyOn(api, 'createAppointment').mockResolvedValue({
      id: 'appt-new',
    } as any);

    renderCreatePage();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Dr. Alexander Wright' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Patient Name/i), {
      target: { value: 'John Smith' },
    });

    const submitBtn = screen.getByRole('button', { name: /Schedule Appointment/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          patientName: 'John Smith',
          doctorId: 'doc-1',
        }),
      );
    });
  });

  it('displays conflict banner when 409 conflict is returned', async () => {
    const conflictError: any = new Error('Doctor already has an appointment');
    conflictError.statusCode = 409;
    conflictError.errorCode = 'APPOINTMENT_CONFLICT';
    conflictError.body = {
      conflictingSlot: {
        startsAt: '2026-09-21T10:00:00.000Z',
        endsAt: '2026-09-21T11:00:00.000Z',
      },
    };

    jest.spyOn(api, 'createAppointment').mockRejectedValue(conflictError);

    renderCreatePage();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Dr. Alexander Wright' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Patient Name/i), {
      target: { value: 'John Smith' },
    });

    const submitBtn = screen.getByRole('button', { name: /Schedule Appointment/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Schedule Conflict Detected')).toBeInTheDocument();
      expect(screen.getByText(/Existing Slot: 10:00 AM – 11:00 AM/i)).toBeInTheDocument();
    });
  });

  it('updates duration when duration preset chips are clicked', () => {
    renderCreatePage();

    const chip30 = screen.getByRole('button', { name: '30 min' });
    fireEvent.click(chip30);

    const durationInput = screen.getByPlaceholderText('e.g. 60') as HTMLInputElement;
    expect(durationInput.value).toBe('30');
  });
});
