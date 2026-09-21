import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { NavigationProvider, useNavigation } from './NavigationContext';

function TestConsumer() {
  const {
    activePage,
    pageFadeState,
    dcmCardStage,
    selectedDate,
    setSelectedDate,
    navigateToViewer,
    navigateToCreate,
    navigateToList,
    setHasDcm,
    hasDcm,
  } = useNavigation();

  return (
    <div>
      <span data-testid="activePage">{activePage}</span>
      <span data-testid="pageFadeState">{pageFadeState}</span>
      <span data-testid="dcmCardStage">{dcmCardStage}</span>
      <span data-testid="selectedDate">{selectedDate}</span>
      <span data-testid="hasDcm">{hasDcm ? 'true' : 'false'}</span>
      <button onClick={() => setSelectedDate('2026-10-01')}>Set Date</button>
      <button onClick={() => navigateToViewer('appt-123')}>Go Viewer</button>
      <button onClick={() => navigateToCreate()}>Go Create</button>
      <button onClick={() => navigateToList('2026-11-01')}>Go List</button>
      <button onClick={() => setHasDcm(true)}>Enable DCM</button>
    </div>
  );
}

describe('NavigationContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    window.history.pushState({}, '', '/');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('throws error when useNavigation is used outside provider', () => {
    // Suppress console.error for expected throw
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      'useNavigation must be used within a NavigationProvider',
    );
    spy.mockRestore();
  });

  it('provides default values on initial render', () => {
    render(
      <NavigationProvider>
        <TestConsumer />
      </NavigationProvider>,
    );

    expect(screen.getByTestId('activePage').textContent).toBe('list');
    expect(screen.getByTestId('pageFadeState').textContent).toBe('visible');
    expect(screen.getByTestId('dcmCardStage').textContent).toBe('hidden');
    expect(screen.getByTestId('hasDcm').textContent).toBe('false');
  });

  it('updates selectedDate when setSelectedDate is called', () => {
    render(
      <NavigationProvider>
        <TestConsumer />
      </NavigationProvider>,
    );

    act(() => {
      screen.getByText('Set Date').click();
    });

    expect(screen.getByTestId('selectedDate').textContent).toBe('2026-10-01');
  });

  it('navigates to viewer with fadeout and fadein transitions', () => {
    render(
      <NavigationProvider>
        <TestConsumer />
      </NavigationProvider>,
    );

    act(() => {
      screen.getByText('Go Viewer').click();
    });

    expect(screen.getByTestId('pageFadeState').textContent).toBe('hidden');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(screen.getByTestId('activePage').textContent).toBe('viewer');

    act(() => {
      jest.advanceTimersByTime(40);
    });

    expect(screen.getByTestId('pageFadeState').textContent).toBe('visible');

    act(() => {
      jest.advanceTimersByTime(300);
    });
  });

  it('navigates to create and back to list with targetDate', () => {
    render(
      <NavigationProvider>
        <TestConsumer />
      </NavigationProvider>,
    );

    act(() => {
      screen.getByText('Go Create').click();
    });

    act(() => {
      jest.advanceTimersByTime(300); // fade to hidden and change page
      jest.advanceTimersByTime(40);  // start fade to visible
      jest.advanceTimersByTime(300); // finish navigation
    });

    expect(screen.getByTestId('activePage').textContent).toBe('create');

    act(() => {
      screen.getByText('Go List').click();
    });

    act(() => {
      jest.advanceTimersByTime(300);
      jest.advanceTimersByTime(40);
      jest.advanceTimersByTime(300);
    });

    expect(screen.getByTestId('activePage').textContent).toBe('list');
    expect(screen.getByTestId('selectedDate').textContent).toBe('2026-11-01');
  });
});
