import {
  fetchAppointments,
  fetchAppointmentById,
  fetchDoctors,
  createAppointment,
  patchAppointmentStatus,
} from './appointments';

describe('API client appointments', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('fetchAppointments', () => {
    it('fetches appointments with correct query params', async () => {
      const mockData = [{ id: '1', patientName: 'John Doe' }];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as any);

      const result = await fetchAppointments({
        date: '2026-09-21',
        doctorId: 'doc-1',
        status: 'scheduled',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/appointments?date=2026-09-21&doctorId=doc-1&status=scheduled',
      );
      expect(result).toEqual(mockData);
    });

    it('throws error when response not ok', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
      } as any);

      await expect(
        fetchAppointments({ date: '2026-09-21' }),
      ).rejects.toThrow('Failed to load appointments');
    });
  });

  describe('fetchAppointmentById', () => {
    it('fetches single appointment by id', async () => {
      const mockData = { id: 'app-1', patientName: 'John Doe' };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as any);

      const result = await fetchAppointmentById('app-1');
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/appointments/app-1');
      expect(result).toEqual(mockData);
    });

    it('throws Appointment not found on 404', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
      } as any);

      await expect(fetchAppointmentById('missing-id')).rejects.toThrow('Appointment not found');
    });

    it('throws generic error on other non-ok status', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as any);

      await expect(fetchAppointmentById('err-id')).rejects.toThrow('Failed to fetch appointment');
    });
  });

  describe('fetchDoctors', () => {
    it('fetches doctors list', async () => {
      const mockData = [{ id: 'doc-1', name: 'Dr. Wright' }];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as any);

      const result = await fetchDoctors();
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/doctors');
      expect(result).toEqual(mockData);
    });

    it('throws error when response not ok', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
      } as any);

      await expect(fetchDoctors()).rejects.toThrow('Failed to load doctors');
    });
  });

  describe('createAppointment', () => {
    const payload = {
      patientName: 'Jane Doe',
      doctorId: 'doc-1',
      startsAt: '2026-09-21T10:00:00.000Z',
      durationMinutes: 45,
    };

    it('creates appointment with POST request', async () => {
      const created = { id: 'app-new', ...payload };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => created,
      } as any);

      const result = await createAppointment(payload);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      expect(result).toEqual(created);
    });

    it('handles conflict and validation error responses properly', async () => {
      const errorBody = {
        message: ['Patient name required', 'Doctor required'],
        error: 'Bad Request',
      };
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => errorBody,
      } as any);

      await expect(createAppointment(payload)).rejects.toMatchObject({
        message: 'Patient name required, Doctor required',
        statusCode: 400,
        errorCode: 'Bad Request',
      });
    });
  });

  describe('patchAppointmentStatus', () => {
    it('sends PATCH request to update status', async () => {
      const updated = { id: 'app-1', status: 'completed' };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => updated,
      } as any);

      const result = await patchAppointmentStatus('app-1', 'completed');
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/appointments/app-1/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      expect(result).toEqual(updated);
    });

    it('handles update failure error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      } as any);

      await expect(patchAppointmentStatus('missing', 'completed')).rejects.toMatchObject({
        message: 'Not found',
        statusCode: 404,
      });
    });
  });
});
