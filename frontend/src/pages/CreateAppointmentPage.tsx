import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAppointment, fetchDoctors } from '../api/appointments';
import { useNavigation } from '../context/NavigationContext';
import { formatUtcTime } from '../utils/dateTime';

export default function CreateAppointmentPage() {
  const { navigateToList, selectedDate, isNavigating } = useNavigation();
  const queryClient = useQueryClient();

  // Load registered doctors
  const { data: doctors = [], isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: fetchDoctors,
    staleTime: 60_000,
  });

  // Form State
  const [patientName, setPatientName] = useState<string>('');
  const [doctorId, setDoctorId] = useState<string>('');
  const [date, setDate] = useState<string>(selectedDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>('10:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [reason, setReason] = useState<string>('');

  // Validation & Conflict State
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [conflictError, setConflictError] = useState<{
    message: string;
    conflictingSlot?: { startsAt: string; endsAt: string };
  } | null>(null);

  // Set default doctor once loaded if not already selected
  React.useEffect(() => {
    if (doctors.length > 0 && !doctorId) {
      setDoctorId(doctors[0].id);
    }
  }, [doctors, doctorId]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      // Validate inputs
      const errors: Record<string, string> = {};
      if (!patientName.trim()) {
        errors.patientName = 'Patient name is required';
      }
      if (!doctorId) {
        errors.doctorId = 'Please select an assigned doctor';
      }
      if (!date) {
        errors.date = 'Appointment date is required';
      }
      if (!time) {
        errors.time = 'Start time is required';
      }
      if (!durationMinutes || durationMinutes <= 0) {
        errors.durationMinutes = 'Duration must be greater than 0 minutes';
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        throw new Error('Validation failed');
      }

      setFieldErrors({});
      setConflictError(null);

      // Construct ISO-8601 UTC timestamp
      const startsAt = new Date(`${date}T${time}:00Z`).toISOString();

      return createAppointment({
        patientName: patientName.trim(),
        doctorId,
        startsAt,
        durationMinutes: Number(durationMinutes),
        reason: reason.trim() || undefined,
      });
    },
    onSuccess: () => {
      // Invalidate queries so schedule list refreshes
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      // Navigate to list with the target date selected
      navigateToList(date);
    },
    onError: (err: any) => {
      if (err.message === 'Validation failed') return;

      // Handle 409 Appointment Conflict
      if (err.statusCode === 409 || err.errorCode === 'APPOINTMENT_CONFLICT') {
        const slot = err.body?.conflictingSlot;
        setConflictError({
          message: err.message,
          conflictingSlot: slot,
        });
      } else {
        setConflictError({
          message: err.message || 'An unexpected error occurred while saving the appointment.',
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  // Quick duration chips
  const durationPresets = [15, 30, 45, 60, 90];

  // Calculate formatted end time preview
  const endTimePreview = React.useMemo(() => {
    try {
      if (!time) return '';
      const [h, m] = time.split(':').map(Number);
      const totalMinutes = h * 60 + m + (durationMinutes || 0);
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      const period = endH >= 12 ? 'PM' : 'AM';
      const displayH = endH % 12 || 12;
      const displayM = endM.toString().padStart(2, '0');
      return `${displayH}:${displayM} ${period}`;
    } catch {
      return '';
    }
  }, [time, durationMinutes]);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* ── Top Header Bar ─────────────────────────────────────────── */}
      <header className="bg-[#1e3a5f] text-white shadow-md sticky top-0 z-20">
        <div className="mx-auto max-w-2xl px-4 py-3.5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigateToList()}
            disabled={isNavigating || createMutation.isPending}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Back to Schedule</span>
          </button>

          <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
            New Appointment
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          {/* Form Header */}
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-[#1e3a5f]">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5M12 12h.008v.008H12V12zm0 3h.008v.008H12V15zm0 3h.008v.008H12V18z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Book New Appointment
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter patient visit details and schedule a clinic slot
                </p>
              </div>
            </div>
          </div>

          {/* ── Conflict Error Banner (Preserves all entered form data) ── */}
          {conflictError && (
            <div className="m-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 animate-fadeIn">
              <div className="p-1 text-amber-600 shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-xs flex-1">
                <h4 className="font-bold text-amber-900 text-sm mb-1">
                  Schedule Conflict Detected
                </h4>
                <p className="text-amber-800 leading-relaxed">
                  {conflictError.message}
                </p>
                {conflictError.conflictingSlot && (
                  <p className="mt-1.5 font-mono text-[11px] bg-amber-100/80 px-2.5 py-1 rounded inline-block text-amber-900">
                    Existing Slot: {formatUtcTime(conflictError.conflictingSlot.startsAt)} – {formatUtcTime(conflictError.conflictingSlot.endsAt)}
                  </p>
                )}
                <p className="mt-2 text-amber-700 font-medium">
                  Your entered form details have been kept. Please choose an adjacent time or select another doctor below.
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
            {/* Patient Name */}
            <div>
              <label htmlFor="patientName" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Patient Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="patientName"
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Alexandra Reed"
                className={`w-full text-sm rounded-xl border px-3.5 py-2.5 shadow-sm transition-all focus:outline-none focus:ring-2 ${
                  fieldErrors.patientName
                    ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-[#1e3a5f] bg-white'
                }`}
              />
              {fieldErrors.patientName && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.patientName}</p>
              )}
            </div>

            {/* Assigned Doctor */}
            <div>
              <label htmlFor="doctorId" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Assigned Doctor <span className="text-rose-500">*</span>
              </label>
              {isLoadingDoctors ? (
                <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              ) : (
                <select
                  id="doctorId"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className={`w-full text-sm rounded-xl border px-3.5 py-2.5 shadow-sm transition-all focus:outline-none focus:ring-2 cursor-pointer ${
                    fieldErrors.doctorId
                      ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-[#1e3a5f] bg-white'
                  }`}
                >
                  <option value="" disabled>Select a doctor...</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name}
                    </option>
                  ))}
                </select>
              )}
              {fieldErrors.doctorId && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.doctorId}</p>
              )}
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full text-sm rounded-xl border px-3.5 py-2.5 shadow-sm transition-all focus:outline-none focus:ring-2 cursor-pointer ${
                    fieldErrors.date
                      ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-[#1e3a5f] bg-white'
                  }`}
                />
                {fieldErrors.date && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.date}</p>
                )}
              </div>

              {/* Start Time */}
              <div>
                <label htmlFor="time" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Start Time <span className="text-rose-500">*</span>
                </label>
                <input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={`w-full text-sm rounded-xl border px-3.5 py-2.5 shadow-sm transition-all focus:outline-none focus:ring-2 cursor-pointer ${
                    fieldErrors.time
                      ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-[#1e3a5f] bg-white'
                  }`}
                />
                {fieldErrors.time && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.time}</p>
                )}
              </div>
            </div>

            {/* Duration */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="durationMinutes" className="text-xs font-semibold text-slate-700">
                  Duration (minutes) <span className="text-rose-500">*</span>
                </label>
                {endTimePreview && (
                  <span className="text-xs font-mono text-slate-500">
                    Calculated slot: <span className="text-slate-800 font-semibold">{time} – {endTimePreview}</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-2">
                {durationPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDurationMinutes(preset)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      durationMinutes === preset
                        ? 'bg-[#1e3a5f] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {preset} min
                  </button>
                ))}
              </div>

              <input
                id="durationMinutes"
                type="number"
                min="1"
                step="1"
                value={durationMinutes || ''}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 0)}
                placeholder="e.g. 60"
                className={`w-full text-sm rounded-xl border px-3.5 py-2.5 shadow-sm transition-all focus:outline-none focus:ring-2 ${
                  fieldErrors.durationMinutes
                    ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-[#1e3a5f] bg-white'
                }`}
              />
              {fieldErrors.durationMinutes && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.durationMinutes}</p>
              )}
            </div>

            {/* Reason for Visit */}
            <div>
              <label htmlFor="reason" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Reason for Visit <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Persistent headaches, follow-up diagnostic MRI consultation..."
                className="w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] bg-white resize-y"
              />
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigateToList()}
                disabled={createMutation.isPending || isNavigating}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={createMutation.isPending || isNavigating}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-[#1e3a5f] hover:from-blue-700 hover:to-[#162d4a] text-white text-xs font-bold shadow-md shadow-blue-900/10 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Scheduling Appointment...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>Schedule Appointment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
