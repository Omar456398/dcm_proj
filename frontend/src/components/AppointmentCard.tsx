import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Appointment, AppointmentStatus } from '../types/appointment';
import { patchAppointmentStatus } from '../api/appointments';
import StatusBadge, { STATUS_BORDER, STATUS_OPTIONS } from './StatusBadge';

interface Props {
  appointment: Appointment;
  queryKey: unknown[];
}

export default function AppointmentCard({ appointment, queryKey }: Props) {
  const queryClient = useQueryClient();
  const [selectOpen, setSelectOpen] = useState(false);

  const startsAt = new Date(appointment.startsAt);
  const endsAt = new Date(startsAt.getTime() + appointment.durationMinutes * 60_000);

  const mutation = useMutation({
    mutationFn: (status: AppointmentStatus) =>
      patchAppointmentStatus(appointment.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const borderColor = STATUS_BORDER[appointment.status];

  return (
    <article
      className={`
        relative bg-white rounded-xl shadow-sm border border-gray-100
        border-l-4 ${borderColor}
        transition-shadow duration-200 hover:shadow-md
        ${appointment.status === 'cancelled' ? 'opacity-60' : ''}
      `}
      aria-label={`Appointment for ${appointment.patientName}`}
    >
      <div className="p-4 sm:p-5">
        {/* Top row: time + status */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
            </svg>
            <span className="font-semibold text-gray-800">
              {format(startsAt, 'h:mm a')}
            </span>
            <span>–</span>
            <span>{format(endsAt, 'h:mm a')}</span>
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {appointment.durationMinutes} min
            </span>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        {/* Patient name */}
        <h3 className="text-base font-semibold text-gray-900 mb-0.5">
          {appointment.patientName}
        </h3>

        {/* Doctor */}
        <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {appointment.doctor?.name ?? 'Unknown Doctor'}
        </p>

        {/* Reason */}
        {appointment.reason && (
          <p className="text-sm text-gray-500 truncate">
            <span className="font-medium text-gray-600">Reason: </span>
            {appointment.reason}
          </p>
        )}

        {/* Status change */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs text-gray-400">
            Update status:
          </span>
          <div className="relative">
            <select
              className="text-sm rounded-lg border border-gray-200 bg-white pl-3 pr-8 py-1.5
                         shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]
                         cursor-pointer transition-colors appearance-none"
              value={appointment.status}
              aria-label={`Change status for ${appointment.patientName}`}
              disabled={mutation.isPending}
              onChange={(e) =>
                mutation.mutate(e.target.value as AppointmentStatus)
              }
              onFocus={() => setSelectOpen(true)}
              onBlur={() => setSelectOpen(false)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {/* Custom chevron */}
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
              {mutation.isPending ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </span>
          </div>
        </div>

        {/* Mutation error */}
        {mutation.isError && (
          <p className="mt-2 text-xs text-rose-600 flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd" />
            </svg>
            Failed to update. Please try again.
          </p>
        )}
      </div>
    </article>
  );
}
