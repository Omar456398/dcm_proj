import React from 'react';

/** Animated skeleton card for loading state */
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-gray-200 p-4 sm:p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="h-5 bg-gray-200 rounded-full w-20" />
      </div>
      <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-36 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-56" />
    </div>
  );
}

/** Empty state when no appointments match filters */
export function EmptyState({ date }: { date: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="mb-4 p-4 rounded-full bg-gray-100">
        <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">No appointments</h3>
      <p className="text-sm text-gray-400">No appointments found for <span className="font-medium">{date}</span> with the selected filters.</p>
    </div>
  );
}

/** Error state */
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="mb-4 p-4 rounded-full bg-rose-50">
        <svg className="h-10 w-10 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">Something went wrong</h3>
      <p className="text-sm text-gray-400 mb-4">Could not load appointments. Check that the backend is running.</p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#162d4a] transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
