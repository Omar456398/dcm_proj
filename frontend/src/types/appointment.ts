// ── Shared types mirroring the backend DTOs ──────────────────────────────

export type AppointmentStatus =
  | 'scheduled'
  | 'checked_in'
  | 'completed'
  | 'cancelled';

export interface Doctor {
  id: string;
  name: string;
}

export interface ImagingStudy {
  id: string;
  appointmentId: string;
  modality: string;
  description: string | null;
  dicomFilePath: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  doctorId: string;
  doctor: Doctor;
  startsAt: string; // ISO-8601
  durationMinutes: number;
  status: AppointmentStatus;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
  imagingStudies?: ImagingStudy[];
}

export interface AppointmentConflictError {
  error: 'APPOINTMENT_CONFLICT';
  message: string;
  conflictingSlot: { startsAt: string; endsAt: string };
}
