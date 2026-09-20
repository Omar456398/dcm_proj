import React, { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatUtcDate, formatUtcTime } from '../utils/dateTime';
import { fetchAppointmentById, patchAppointmentStatus } from '../api/appointments';
import { AppointmentStatus } from '../types/appointment';
import { useNavigation } from '../context/NavigationContext';
import StatusBadge, { STATUS_BORDER, STATUS_OPTIONS } from '../components/StatusBadge';
import DcmContainerCard from '../components/DcmContainerCard';
import { ErrorState, SkeletonCard } from '../components/States';

export default function AppointmentViewerPage() {
  const {
    selectedAppointmentId,
    navigateToList,
    isNavigating,
    dcmCardStage,
    setHasDcm,
  } = useNavigation();

  const queryClient = useQueryClient();

  const {
    data: appointment,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['appointment', selectedAppointmentId],
    queryFn: () => {
      if (!selectedAppointmentId) {
        throw new Error('No appointment selected');
      }
      return fetchAppointmentById(selectedAppointmentId);
    },
    enabled: Boolean(selectedAppointmentId),
    staleTime: 30_000,
  });

  // Check if DICOM imaging studies exist for this appointment
  const imagingStudies = appointment?.imagingStudies ?? [];
  const hasDcm = imagingStudies.length > 0;

  // Inform the navigation context whether DCM is available
  useEffect(() => {
    if (appointment) {
      setHasDcm(hasDcm);
    }
  }, [appointment, hasDcm, setHasDcm]);

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: (status: AppointmentStatus) => {
      if (!appointment) throw new Error('No appointment');
      return patchAppointmentStatus(appointment.id, status);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['appointment', appointment?.id], updated);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
          <div className="h-6 bg-slate-200 rounded w-48 animate-pulse" />
          <SkeletonCard />
          <div className="h-72 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !appointment) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <ErrorState onRetry={refetch} />
        <button
          onClick={() => navigateToList()}
          disabled={isNavigating}
          className="mt-4 inline-flex items-center gap-2 text-sm text-[#1e3a5f] font-semibold hover:underline"
        >
          ← Return to Appointments List
        </button>
      </div>
    );
  }

  const startsAt = new Date(appointment.startsAt);
  const endsAt = new Date(startsAt.getTime() + appointment.durationMinutes * 60_000);
  const borderColor = STATUS_BORDER[appointment.status];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-[#1e3a5f] text-white shadow-md sticky top-0 z-20">
        <div className="mx-auto max-w-4xl px-4 py-3.5 flex items-center justify-between gap-3">
          <button
            onClick={() => navigateToList()}
            disabled={isNavigating}
            aria-label="Back to schedule"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Back to Schedule</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-200 hidden sm:inline">
              Appointment Viewer
            </span>
            <StatusBadge status={appointment.status} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <section
          aria-label="Appointment details"
          className={`bg-white rounded-2xl shadow-sm border border-slate-200/80 border-l-4 ${borderColor} p-5 sm:p-6`}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="p-2 rounded-xl bg-blue-50 text-[#1e3a5f]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </span>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    {appointment.patientName}
                  </h1>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {appointment.id}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/60 self-start">
              <label htmlFor="viewer-status-select" className="text-xs font-medium text-slate-500">
                Status:
              </label>
              <div className="relative">
                <select
                  id="viewer-status-select"
                  className="text-xs font-medium rounded-lg border border-slate-200 bg-white pl-2.5 pr-7 py-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] cursor-pointer appearance-none"
                  value={appointment.status}
                  disabled={statusMutation.isPending || isNavigating}
                  onChange={(e) =>
                    statusMutation.mutate(e.target.value as AppointmentStatus)
                  }
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                  {statusMutation.isPending ? (
                    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100 text-sm">
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Date & Time
              </span>
              <p className="font-semibold text-slate-800">
                {formatUtcDate(startsAt)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatUtcTime(startsAt)} – {formatUtcTime(endsAt)} ({appointment.durationMinutes} min)
              </p>
            </div>

            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Assigned Doctor
              </span>
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                {appointment.doctor?.name ?? 'Assigned Doctor'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Primary Care / Imaging</p>
            </div>

            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Reason for Visit
              </span>
              <p className="font-medium text-slate-800">
                {appointment.reason || 'Routine Consultation'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {hasDcm ? 'Diagnostic scans ordered' : 'No imaging requested'}
              </p>
            </div>
          </div>
        </section>

        {hasDcm ? (
          <section aria-label="DICOM Viewer Section">
            <DcmContainerCard
              imagingStudies={imagingStudies}
              stage={dcmCardStage}
            />
          </section>
        ) : (
          /* When no DCM is present: do not display the DCM card! */
          <div className="bg-white rounded-2xl p-8 border border-dashed border-slate-300 text-center">
            <div className="inline-flex p-3 rounded-full bg-slate-100 text-slate-400 mb-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-700">No DICOM Scans Attached</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              This appointment does not have any attached diagnostic imaging studies or DICOM files.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
