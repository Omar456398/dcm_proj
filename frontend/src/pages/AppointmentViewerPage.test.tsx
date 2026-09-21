import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppointmentViewerPage from './AppointmentViewerPage';
import { NavigationProvider } from '../context/NavigationContext';
import * as api from '../api/appointments';

jest.mock('../components/DcmContainerCard', () => {
  return function MockDcmContainer({ imagingStudies, stage }: any) {
    return (
      <div data-testid="dcm-container-card">
        DCM Card (stage: {stage}, studies: {imagingStudies.length})
      </div>
    );
  };
});

const mockAppointmentWithDcm = {
  id: 'appt-1',
  patientName: 'Jane Doe',
  doctorId: 'doc-1',
  startsAt: '2026-09-21T10:00:00.000Z',
  durationMinutes: 45,
  status: 'scheduled',
  reason: 'Follow-up MRI review',
  doctor: { id: 'doc-1', name: 'Dr. Alexander Wright' },
  imagingStudies: [
    {
      id: 's-1',
      appointmentId: 'appt-1',
      modality: 'MR',
      description: 'Brain MRI',
      dicomFilePath: 'assets/mri.dcm',
    },
  ],
};

import { NavigationContext } from '../context/NavigationContext';

function renderViewerWithId(id: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const mockNavValue: any = {
    activePage: 'viewer',
    selectedAppointmentId: id,
    selectedDate: '2026-09-21',
    setSelectedDate: jest.fn(),
    pageFadeState: 'visible',
    dcmCardStage: 'open',
    isNavigating: false,
    hasDcm: true,
    setHasDcm: jest.fn(),
    navigateToViewer: jest.fn(),
    navigateToCreate: jest.fn(),
    navigateToList: jest.fn(),
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <NavigationContext.Provider value={mockNavValue}>
        <AppointmentViewerPage />
      </NavigationContext.Provider>
    </QueryClientProvider>,
  );
}

describe('AppointmentViewerPage component', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders loading skeleton while query is loading', () => {
    jest.spyOn(api, 'fetchAppointmentById').mockReturnValue(new Promise(() => {}));

    const { container } = renderViewerWithId('appt-1');
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders error state when fetch fails', async () => {
    jest.spyOn(api, 'fetchAppointmentById').mockRejectedValue(new Error('Network error'));

    renderViewerWithId('appt-1');

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('renders appointment details and DCM container card when study exists', async () => {
    jest.spyOn(api, 'fetchAppointmentById').mockResolvedValue(mockAppointmentWithDcm as any);

    renderViewerWithId('appt-1');

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('Dr. Alexander Wright')).toBeInTheDocument();
    expect(screen.getByText('Follow-up MRI review')).toBeInTheDocument();
    expect(screen.getByTestId('dcm-container-card')).toBeInTheDocument();
  });

  it('renders "No DICOM Scans Attached" message when no imaging studies exist', async () => {
    const noDcmAppt = { ...mockAppointmentWithDcm, imagingStudies: [] };
    jest.spyOn(api, 'fetchAppointmentById').mockResolvedValue(noDcmAppt as any);

    renderViewerWithId('appt-1');

    await waitFor(() => {
      expect(screen.getByText('No DICOM Scans Attached')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('dcm-container-card')).not.toBeInTheDocument();
  });

  it('allows changing status from the viewer dropdown', async () => {
    jest.spyOn(api, 'fetchAppointmentById').mockResolvedValue(mockAppointmentWithDcm as any);
    const patchSpy = jest.spyOn(api, 'patchAppointmentStatus').mockResolvedValue({
      ...mockAppointmentWithDcm,
      status: 'completed',
    } as any);

    renderViewerWithId('appt-1');

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    const select = screen.getByLabelText(/Status:/i);
    fireEvent.change(select, { target: { value: 'completed' } });

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith('appt-1', 'completed');
    });
  });
});
