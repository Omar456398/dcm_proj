import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatUtcDate, shiftUtcDays, getTodayUtcDate } from '../utils/dateTime';
import { fetchAppointments, fetchDoctors } from '../api/appointments';
import { AppointmentStatus } from '../types/appointment';
import { useNavigation } from '../context/NavigationContext';
import AppointmentCard from '../components/AppointmentCard';
import { SkeletonCard, EmptyState, ErrorState } from '../components/States';
import { STATUS_OPTIONS } from '../components/StatusBadge';

const ALL = 'all';

export default function AppointmentsPage() {
  const { selectedDate, setSelectedDate, navigateToCreate, isNavigating } = useNavigation();
  const today = getTodayUtcDate();
  const date = selectedDate || today;
  const setDate = setSelectedDate;

  const [doctorId, setDoctorId] = useState<string>(ALL);
  const [status, setStatus] = useState<AppointmentStatus | typeof ALL>(ALL);

  const queryKey = ['appointments', date, doctorId, status] as const;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      fetchAppointments({
        date,
        doctorId: doctorId === ALL ? undefined : doctorId,
        status: status === ALL ? undefined : (status as AppointmentStatus),
      }),
    staleTime: 30_000,
  });

  // Query doctors from backend endpoint, fallback to deriving from appointments
  const { data: serverDoctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: fetchDoctors,
    staleTime: 60_000,
  });

  const doctors = React.useMemo(() => {
    if (serverDoctors.length > 0) return serverDoctors;
    if (!data) return [];
    const map = new Map<string, string>();
    data.forEach((a) => {
      if (a.doctor) map.set(a.doctor.id, a.doctor.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [serverDoctors, data]);

  const dateLabel = formatUtcDate(new Date(`${date}T00:00:00Z`));
  const isToday = date === today;

  function shiftDate(days: number) {
    setDate(shiftUtcDays(date, days));
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-[#1e3a5f] text-white shadow-md">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5M12 12h.008v.008H12V12zm0 3h.008v.008H12V15zm0 3h.008v.008H12V18z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">Clinic Scheduler</h1>
              <p className="text-xs text-blue-200 mt-0.5">Appointment Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {data && !isLoading && (
              <span className="hidden sm:inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium">
                {data.length} appointment{data.length !== 1 ? 's' : ''}
              </span>
            )}

            {/* New Appointment button */}
            <button
              onClick={() => navigateToCreate()}
              disabled={isNavigating}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold shadow transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>New Appointment</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        <section aria-label="Date navigation"
          className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => shiftDate(-1)}
              aria-label="Previous day"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[#1e3a5f] transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex flex-col items-center gap-1">
              <span className="text-base font-semibold text-gray-800">{dateLabel}</span>
              <div className="flex items-center gap-2">
                {isToday && (
                  <span className="text-xs rounded-full bg-[#1e3a5f] text-white px-2 py-0.5 font-medium">
                    Today
                  </span>
                )}
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  aria-label="Select date"
                  className="text-xs text-gray-400 underline cursor-pointer bg-transparent border-none focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={() => shiftDate(1)}
              aria-label="Next day"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[#1e3a5f] transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </section>

        <section aria-label="Filters"
          className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 space-y-3">

          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <label htmlFor="doctor-filter" className="text-xs font-medium text-gray-500 shrink-0">
              Doctor
            </label>
            <select
              id="doctor-filter"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="flex-1 text-sm rounded-lg border border-gray-200 bg-white px-3 py-1.5
                         shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] cursor-pointer"
            >
              <option value={ALL}>All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            <span className="text-xs font-medium text-gray-500 shrink-0">Status</span>
            <button
              onClick={() => setStatus(ALL)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                status === ALL
                  ? 'bg-[#1e3a5f] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {STATUS_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setStatus(o.value)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  status === o.value
                    ? 'bg-[#1e3a5f] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </section>

        <section aria-label="Appointments list" aria-live="polite">

          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
            </div>
          )}

          {isError && <ErrorState onRetry={refetch} />}

          {data && !isLoading && data.length === 0 && (
            <EmptyState date={dateLabel} />
          )}

          {data && data.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between sm:hidden">
                <span className="text-xs text-gray-500 font-medium">
                  {data.length} appointment{data.length !== 1 ? 's' : ''}
                </span>
              </div>

              {data.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  queryKey={queryKey as unknown as unknown[]}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
