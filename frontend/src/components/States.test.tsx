import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkeletonCard, EmptyState, ErrorState } from './States';

describe('States components', () => {
  describe('SkeletonCard', () => {
    it('renders animated skeleton placeholders', () => {
      const { container } = render(<SkeletonCard />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('EmptyState', () => {
    it('renders empty message with the provided date', () => {
      render(<EmptyState date="2026-09-21" />);
      expect(screen.getByText('No appointments')).toBeInTheDocument();
      expect(screen.getByText('2026-09-21')).toBeInTheDocument();
    });
  });

  describe('ErrorState', () => {
    it('renders error message and invokes onRetry on button click', () => {
      const onRetry = jest.fn();
      render(<ErrorState onRetry={onRetry} />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      const button = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(button);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
