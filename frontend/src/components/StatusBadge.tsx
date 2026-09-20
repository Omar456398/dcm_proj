import React from 'react';
import { AppointmentStatus } from '../types/appointment';

const CONFIG: Record<
  AppointmentStatus,
  { label: string; dot: string; badge: string }
> = {
  scheduled: {
    label: 'Scheduled',
    dot: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 ring-blue-200',
  },
  checked_in: {
    label: 'Checked In',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  completed: {
    label: 'Completed',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  cancelled: {
    label: 'Cancelled',
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
  },
};

interface Props {
  status: AppointmentStatus;
}

export default function StatusBadge({ status }: Props) {
  const { label, dot, badge } = CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export const STATUS_BORDER: Record<AppointmentStatus, string> = {
  scheduled: 'border-l-blue-500',
  checked_in: 'border-l-amber-500',
  completed: 'border-l-emerald-500',
  cancelled: 'border-l-rose-500',
};

export const STATUS_OPTIONS = Object.entries(CONFIG).map(([value, { label }]) => ({
  value: value as AppointmentStatus,
  label,
}));
