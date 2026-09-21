import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusBadge, { STATUS_BORDER, STATUS_OPTIONS } from './StatusBadge';
import { AppointmentStatus } from '../types/appointment';

describe('StatusBadge component', () => {
  it.each([
    ['scheduled', 'Scheduled'],
    ['checked_in', 'Checked In'],
    ['completed', 'Completed'],
    ['cancelled', 'Cancelled'],
  ] as [AppointmentStatus, string][])('renders correct label for %s', (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('exports valid STATUS_BORDER map', () => {
    expect(STATUS_BORDER.scheduled).toBe('border-l-blue-500');
    expect(STATUS_BORDER.checked_in).toBe('border-l-amber-500');
    expect(STATUS_BORDER.completed).toBe('border-l-emerald-500');
    expect(STATUS_BORDER.cancelled).toBe('border-l-rose-500');
  });

  it('exports STATUS_OPTIONS array with all 4 statuses', () => {
    expect(STATUS_OPTIONS).toHaveLength(4);
    expect(STATUS_OPTIONS.map((o) => o.value)).toEqual([
      'scheduled',
      'checked_in',
      'completed',
      'cancelled',
    ]);
  });
});
