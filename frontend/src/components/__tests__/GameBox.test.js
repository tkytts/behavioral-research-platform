import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider , initReactI18next } from 'react-i18next';
import i18n from 'i18next';


import GameBox from '../GameBox';
import { ChimesConfigProvider } from '../../context/ChimesConfigContext';

// Mock realtime/game module before imports
jest.mock('../../realtime/game', () => ({
  connectionReady: Promise.resolve(),
  onTimerUpdate: jest.fn(),
  offTimerUpdate: jest.fn(),
  onSetAnswer: jest.fn(),
  offSetAnswer: jest.fn(),
  onGameResolved: jest.fn(),
  offGameResolved: jest.fn(),
  onProblemUpdate: jest.fn(),
  offProblemUpdate: jest.fn(),
  startTimer: jest.fn().mockResolvedValue(undefined),
  stopTimer: jest.fn().mockResolvedValue(undefined),
  resetTimer: jest.fn().mockResolvedValue(undefined),
  onChimesUpdated: jest.fn(),
  offChimesUpdated: jest.fn(),
  getChimes: jest.fn().mockResolvedValue(undefined),
  setChimes: jest.fn().mockResolvedValue(undefined),
}));

const gameModule = require('../../realtime/game');

// Initialize test i18n instance
// eslint-disable-next-line import/no-named-as-default-member
const testI18n = i18n.createInstance();
testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        find_the_solution_to_the_problem: 'Find the solution to the problem',
        loading_problem: 'Loading problem...',
        team_answer: 'Team answer',
        points: 'Points',
        start_timer: 'Start Timer',
        stop_timer: 'Stop Timer',
        reset_timer: 'Reset Timer',
        time_is_up: "Time's up!",
        '1_second_left': '1 second left',
        n_seconds_left: '{{count}} seconds left',
        team_answer_was: 'Team answer was',
        the_answer_was: 'The answer was',
        correct: 'correct',
        incorrect: 'incorrect',
        you_earned_points: 'You earned {{count}} points',
      },
    },
  },
  interpolation: { escapeValue: false },
});

let mockAudio;

const renderGameBox = (props = {}) => {
  const defaultProps = {
    isAdmin: false,
    gamesRef: { current: null },
    timerRef: { current: null },
    pointsRef: { current: null },
    teamAnswerRef: { current: null },
  };

  return render(
    <I18nextProvider i18n={testI18n}>
      <BrowserRouter>
        <ChimesConfigProvider>
          <GameBox {...defaultProps} {...props} />
        </ChimesConfigProvider>
      </BrowserRouter>
    </I18nextProvider>
  );
};

describe('GameBox', () => {
  beforeEach(() => {
    mockAudio = {
      play: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn(),
      currentTime: 0,
      preload: '',
      paused: true,
    };
    jest.spyOn(window, 'Audio').mockImplementation(() => mockAudio);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the game box', () => {
    renderGameBox();
    
    expect(screen.getByText(/find the solution to the problem/i)).toBeInTheDocument();
  });

  it('shows loading state when no problem is set', () => {
    renderGameBox();
    
    expect(screen.getByText(/loading problem/i)).toBeInTheDocument();
  });

  it('displays team answer section', () => {
    renderGameBox();
    
    expect(screen.getByText(/team answer/i)).toBeInTheDocument();
  });

  it('displays points section', () => {
    renderGameBox();
    
    expect(screen.getByText(/points/i)).toBeInTheDocument();
  });

  it('shows timer controls for admin', () => {
    renderGameBox({ isAdmin: true });
    
    expect(screen.getByRole('button', { name: /start timer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stop timer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset timer/i })).toBeInTheDocument();
  });

  it('does not show timer controls for non-admin', () => {
    renderGameBox({ isAdmin: false });
    
    expect(screen.queryByRole('button', { name: /start timer/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /stop timer/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reset timer/i })).not.toBeInTheDocument();
  });

  it('calls startTimer when start button is clicked', async () => {
    renderGameBox({ isAdmin: true });
    
    fireEvent.click(screen.getByRole('button', { name: /start timer/i }));
    
    expect(gameModule.startTimer).toHaveBeenCalled();
  });

  it('calls stopTimer when stop button is clicked', async () => {
    renderGameBox({ isAdmin: true });
    
    fireEvent.click(screen.getByRole('button', { name: /stop timer/i }));
    
    expect(gameModule.stopTimer).toHaveBeenCalled();
  });

  it('calls resetTimer when reset button is clicked', async () => {
    renderGameBox({ isAdmin: true });
    
    fireEvent.click(screen.getByRole('button', { name: /reset timer/i }));
    
    expect(gameModule.resetTimer).toHaveBeenCalled();
  });

  it('registers event handlers on mount', () => {
    renderGameBox();
    
    expect(gameModule.onTimerUpdate).toHaveBeenCalled();
    expect(gameModule.onSetAnswer).toHaveBeenCalled();
    expect(gameModule.onGameResolved).toHaveBeenCalled();
    expect(gameModule.onProblemUpdate).toHaveBeenCalled();
  });

  it('unregisters event handlers on unmount', () => {
    const { unmount } = renderGameBox();
    
    unmount();
    
    expect(gameModule.offTimerUpdate).toHaveBeenCalled();
    expect(gameModule.offSetAnswer).toHaveBeenCalled();
    expect(gameModule.offGameResolved).toHaveBeenCalled();
    expect(gameModule.offProblemUpdate).toHaveBeenCalled();
  });

  it('has proper button styling for admin controls', () => {
    renderGameBox({ isAdmin: true });
    
    expect(screen.getByRole('button', { name: /start timer/i })).toHaveClass('btn-primary');
    expect(screen.getByRole('button', { name: /stop timer/i })).toHaveClass('btn-danger');
    expect(screen.getByRole('button', { name: /reset timer/i })).toHaveClass('btn-secondary');
  });

  describe('result display', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it('result paragraphs are hidden on initial render', () => {
      renderGameBox();

      expect(screen.getByTestId('result-answer')).toHaveStyle({ visibility: 'hidden' });
      expect(screen.getByTestId('result-correct')).toHaveStyle({ visibility: 'hidden' });
      expect(screen.getByTestId('result-points')).toHaveStyle({ visibility: 'hidden' });
    });

    it('reveals team answer line after 3 seconds', () => {
      renderGameBox();

      const gameResolvedHandler = gameModule.onGameResolved.mock.calls[0][0];
      act(() => {
        gameResolvedHandler({ teamAnswer: 'blue', isAnswerCorrect: true, pointsAwarded: 7, currentScore: 7 });
      });

      act(() => { jest.advanceTimersByTime(3000); });

      expect(screen.getByTestId('result-answer')).toHaveStyle({ visibility: 'visible' });
      expect(screen.getByTestId('result-answer')).not.toHaveAttribute('aria-hidden', 'true');
    });

    it('reveals correct/incorrect line after 6 seconds', () => {
      renderGameBox();

      const gameResolvedHandler = gameModule.onGameResolved.mock.calls[0][0];
      act(() => {
        gameResolvedHandler({ teamAnswer: 'blue', isAnswerCorrect: true, pointsAwarded: 7, currentScore: 7 });
      });

      act(() => { jest.advanceTimersByTime(3000); });
      expect(screen.getByTestId('result-correct')).toHaveStyle({ visibility: 'hidden' });

      act(() => { jest.advanceTimersByTime(3000); });
      expect(screen.getByTestId('result-correct')).toHaveStyle({ visibility: 'visible' });
      expect(screen.getByTestId('result-correct')).not.toHaveAttribute('aria-hidden', 'true');
    });

    it('reveals points line after 9 seconds', () => {
      renderGameBox();

      const gameResolvedHandler = gameModule.onGameResolved.mock.calls[0][0];
      act(() => {
        gameResolvedHandler({ teamAnswer: 'blue', isAnswerCorrect: true, pointsAwarded: 7, currentScore: 7 });
      });

      act(() => { jest.advanceTimersByTime(6000); });
      expect(screen.getByTestId('result-points')).toHaveStyle({ visibility: 'hidden' });

      act(() => { jest.advanceTimersByTime(3000); });
      expect(screen.getByTestId('result-points')).toHaveStyle({ visibility: 'visible' });
      expect(screen.getByTestId('result-points')).not.toHaveAttribute('aria-hidden', 'true');
    });

    it('hides all result lines immediately when a new problem arrives mid-reveal', () => {
      renderGameBox();

      const gameResolvedHandler = gameModule.onGameResolved.mock.calls[0][0];
      const problemUpdateHandler = gameModule.onProblemUpdate.mock.calls[0][0];

      act(() => {
        gameResolvedHandler({ teamAnswer: 'blue', isAnswerCorrect: true, pointsAwarded: 7, currentScore: 7 });
      });

      // Advance past the first reveal (answer line is now visible)
      act(() => { jest.advanceTimersByTime(3000); });
      expect(screen.getByTestId('result-answer')).toHaveStyle({ visibility: 'visible' });

      // New problem arrives mid-reveal — timers should be cancelled and lines hidden
      act(() => {
        problemUpdateHandler({ block: { name: 'block1' }, problem: 'problem1' });
      });

      expect(screen.getByTestId('result-answer')).toHaveStyle({ visibility: 'hidden' });
      expect(screen.getByTestId('result-correct')).toHaveStyle({ visibility: 'hidden' });
      expect(screen.getByTestId('result-points')).toHaveStyle({ visibility: 'hidden' });

      // Remaining timer time elapses — nothing should re-appear
      act(() => { jest.advanceTimersByTime(6000); });
      expect(screen.getByTestId('result-answer')).toHaveStyle({ visibility: 'hidden' });
      expect(screen.getByTestId('result-correct')).toHaveStyle({ visibility: 'hidden' });
      expect(screen.getByTestId('result-points')).toHaveStyle({ visibility: 'hidden' });
    });
  });

   describe('countdown audio', () => {
      it('initializes Audio after mount with correct url and preload setting', () => {
        renderGameBox();

        expect(window.Audio).toHaveBeenCalledTimes(1);
        expect(window.Audio).toHaveBeenCalledWith('/sounds/countdown.mp3');
        expect(mockAudio.preload).toBe('auto');
      });

      it('pauses audio and clears ref on unmount', () => {
        const { unmount } = renderGameBox();

        unmount();

        expect(mockAudio.pause).toHaveBeenCalled();
      });

      it('plays countdown audio when timer reaches 10 with game live and user interacted', () => {
        renderGameBox();

        fireEvent.click(document.body);

        const problemUpdateHandler = gameModule.onProblemUpdate.mock.calls[0][0];
        act(() => {
          problemUpdateHandler({ block: { name: 'block1' }, problem: 'problem1' });
        });

        const timerUpdateHandler = gameModule.onTimerUpdate.mock.calls[0][0];
        act(() => {
          timerUpdateHandler(10);
        });

        expect(mockAudio.play).toHaveBeenCalled();
      });

      it('pauses countdown audio when timer goes above 10 and audio is playing', () => {
        renderGameBox();
        mockAudio.paused = false;

        fireEvent.click(document.body);

        const problemUpdateHandler = gameModule.onProblemUpdate.mock.calls[0][0];
        act(() => {
          problemUpdateHandler({ block: { name: 'block1' }, problem: 'problem1' });
        });

        const timerUpdateHandler = gameModule.onTimerUpdate.mock.calls[0][0];
        act(() => {
          timerUpdateHandler(15);
        });

        expect(mockAudio.pause).toHaveBeenCalled();
        expect(mockAudio.currentTime).toBe(0);
      });

      it('does not call pause when timer is above 10 and audio is already paused', () => {
        renderGameBox();
        mockAudio.paused = true;

        fireEvent.click(document.body);

        const problemUpdateHandler = gameModule.onProblemUpdate.mock.calls[0][0];
        act(() => {
          problemUpdateHandler({ block: { name: 'block1' }, problem: 'problem1' });
        });

        const timerUpdateHandler = gameModule.onTimerUpdate.mock.calls[0][0];
        act(() => {
          timerUpdateHandler(15);
        });

        expect(mockAudio.pause).not.toHaveBeenCalled();
      });

      it('pauses and resets audio when stop timer button is clicked', () => {
        renderGameBox({ isAdmin: true });

        fireEvent.click(screen.getByRole('button', { name: /stop timer/i }));

        expect(mockAudio.pause).toHaveBeenCalled();
        expect(mockAudio.currentTime).toBe(0);
      });

      it('pauses and resets audio when reset timer button is clicked', () => {
        renderGameBox({ isAdmin: true });

        fireEvent.click(screen.getByRole('button', { name: /reset timer/i }));

        expect(mockAudio.pause).toHaveBeenCalled();
        expect(mockAudio.currentTime).toBe(0);
      });
    })
});
