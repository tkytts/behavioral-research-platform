import React from 'react';
import { render, screen } from '@testing-library/react';

import i18n from '../../i18n';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws an error
const ThrowingComponent = () => {
  throw new Error('Test error');
};

// Component that renders normally
const WorkingComponent = () => <div>Working content</div>;

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests since we expect errors
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Working content')).toBeInTheDocument();
  });

  it('renders error message when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('An error occurred')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  it('renders a reload button', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
  });

  it('calls console.error from componentDidCatch', () => {
    console.error.mockClear();
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalled();
  });

  it('does not render children after error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    
    expect(screen.queryByText('Working content')).not.toBeInTheDocument();
  });

  it('updates state correctly via getDerivedStateFromError', () => {
    const result = ErrorBoundary.getDerivedStateFromError(new Error('Test'));
    expect(result).toEqual({ hasError: true });
  });
});
