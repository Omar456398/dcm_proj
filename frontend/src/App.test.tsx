import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App component', () => {
  it('renders Clinic Scheduler header on initial load', () => {
    render(<App />);
    const headingElement = screen.getByText(/Clinic Scheduler/i);
    expect(headingElement).toBeInTheDocument();
  });
});
