import { Appointment, AppointmentStatus } from '../types/appointment';

const BASE = 'http://localhost:3001';

export async function fetchAppointments(params: {
  date: string;
  doctorId?: string;
  status?: AppointmentStatus;
}): Promise<Appointment[]> {
  const search = new URLSearchParams({ date: params.date });
  if (params.doctorId) search.set('doctorId', params.doctorId);
  if (params.status) search.set('status', params.status);

  const res = await fetch(`${BASE}/appointments?${search}`);
  if (!res.ok) throw new Error('Failed to load appointments');
  return res.json();
}

export async function fetchAppointmentById(id: string): Promise<Appointment> {
  const res = await fetch(`${BASE}/appointments/${id}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Appointment not found');
    throw new Error('Failed to fetch appointment');
  }
  return res.json();
}

export async function patchAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  const res = await fetch(`${BASE}/appointments/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body?.message ?? 'Update failed'), {
      statusCode: res.status,
      body,
    });
  }
  return res.json();
}
