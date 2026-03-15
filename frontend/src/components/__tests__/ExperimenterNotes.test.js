import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';

import ExperimenterNotes from '../ExperimenterNotes';

const testI18n = i18n.createInstance();
testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        notes_label: 'Researcher Notes',
        notes_placeholder: 'Type your notes here...',
        notes_marker_block: 'Block',
        notes_marker_problem: 'Problem',
      },
    },
  },
  interpolation: { escapeValue: false },
});

const renderNotes = (props = {}) => {
  const defaults = { currentBlockIndex: 0, currentProblem: 0, confederateName: 'Ana' };
  return render(
    <I18nextProvider i18n={testI18n}>
      <ExperimenterNotes {...defaults} {...props} />
    </I18nextProvider>
  );
};

describe('ExperimenterNotes', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders textarea and label', () => {
    renderNotes();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText(/researcher notes/i)).toBeInTheDocument();
  });

  it('reads initial value from localStorage', () => {
    localStorage.setItem('experimenter_notes', 'existing notes');
    renderNotes();
    expect(screen.getByRole('textbox').value).toBe('existing notes');
  });

  it('updates notes state on change', () => {
    renderNotes();
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'new text' } });
    expect(textarea.value).toBe('new text');
  });

  it('writes to localStorage after debounce delay', () => {
    renderNotes();
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'new text' } });
    expect(localStorage.getItem('experimenter_notes')).toBeNull();
    act(() => jest.advanceTimersByTime(500));
    expect(localStorage.getItem('experimenter_notes')).toBe('new text');
  });

  it('does not insert marker on initial mount', () => {
    renderNotes({ currentBlockIndex: 0, currentProblem: 0 });
    expect(screen.getByRole('textbox').value).toBe('');
  });

  it('inserts marker when currentBlockIndex changes', () => {
    const { rerender } = renderNotes({ currentBlockIndex: 0, currentProblem: 0 });
    rerender(
      <I18nextProvider i18n={testI18n}>
        <ExperimenterNotes currentBlockIndex={1} currentProblem={0} confederateName="Ana" />
      </I18nextProvider>
    );
    expect(screen.getByRole('textbox').value).toContain('Block 2');
  });

  it('inserts marker containing confederate name', () => {
    const { rerender } = renderNotes({ currentBlockIndex: 0, currentProblem: 0, confederateName: 'Maria' });
    rerender(
      <I18nextProvider i18n={testI18n}>
        <ExperimenterNotes currentBlockIndex={1} currentProblem={0} confederateName="Maria" />
      </I18nextProvider>
    );
    expect(screen.getByRole('textbox').value).toContain('Maria');
  });

  it('inserts marker when currentProblem changes', () => {
    const { rerender } = renderNotes({ currentBlockIndex: 0, currentProblem: 0 });
    rerender(
      <I18nextProvider i18n={testI18n}>
        <ExperimenterNotes currentBlockIndex={0} currentProblem={1} confederateName="Ana" />
      </I18nextProvider>
    );
    expect(screen.getByRole('textbox').value).toContain('Problem 2');
  });

  it('clears notes when remounted via key change', () => {
    localStorage.setItem('experimenter_notes', 'old notes');
    const { unmount } = renderNotes();
    expect(screen.getByRole('textbox').value).toBe('old notes');

    unmount();
    localStorage.removeItem('experimenter_notes');

    renderNotes();
    expect(screen.getByRole('textbox').value).toBe('');
  });
});
