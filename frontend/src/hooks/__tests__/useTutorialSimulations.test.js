import { renderHook, act } from '@testing-library/react';

import useTutorialSimulations from '../useTutorialSimulations';

jest.mock('../../realtime/game', () => ({
  setConfederate: jest.fn(),
  tutorialProblem: jest.fn(),
  startTimer: jest.fn(),
  stopTimer: jest.fn(),
  typing: jest.fn(),
  sendMessage: jest.fn(),
  setAnswer: jest.fn(),
  setGameResolution: jest.fn(),
  setMaxTime: jest.fn(),
  resetPoints: jest.fn(),
  clearChat: jest.fn(),
}));

jest.mock('../../utils/typeMessage', () => ({
  typeMessage: jest.fn(() => 1),
}));

// i18n mock
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k }),
}));

jest.useFakeTimers();

const mockGame = require('../../realtime/game');

function makeRefs() {
  return {
    activeTimersRef: { current: [] },
    readyButtonRef: { current: { classList: { add: jest.fn(), remove: jest.fn() } } },
    messageRef: { current: { getBoundingClientRect: () => ({ top: 0, left: 0, width: 100, height: 30 }) } },
    sendButtonRef: { current: { classList: { add: jest.fn(), remove: jest.fn() } } },
    currentUserRef: { current: 'TestUser' },
    setCurrentUser: jest.fn(),
    setCurrentTutorialStep: jest.fn(),
    setShowMessageBox: jest.fn(),
    setMessageInputStyle: jest.fn(),
    setNewMessage: jest.fn(),
  };
}

describe('useTutorialSimulations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  it('returns expected handlers', () => {
    const refs = makeRefs();
    const { result } = renderHook(() => useTutorialSimulations(refs));
    expect(typeof result.current.safeTimeout).toBe('function');
    expect(typeof result.current.clearAllTimers).toBe('function');
    expect(typeof result.current.handleSimulation1).toBe('function');
    expect(typeof result.current.handleTutorialStep13).toBe('function');
    expect(typeof result.current.handleSimulation2).toBe('function');
    expect(typeof result.current.handleTutorialStep17).toBe('function');
    expect(typeof result.current.handleSimulation3).toBe('function');
    expect(typeof result.current.handleTutorialStep20).toBe('function');
  });

  it('clearAllTimers clears registered timers', () => {
    const refs = makeRefs();
    const { result } = renderHook(() => useTutorialSimulations(refs));

    act(() => {
      result.current.safeTimeout(() => {}, 1000);
      result.current.safeTimeout(() => {}, 2000);
    });

    expect(refs.activeTimersRef.current.length).toBe(2);

    act(() => {
      result.current.clearAllTimers();
    });

    expect(refs.activeTimersRef.current.length).toBe(0);
  });

  it('handleSimulation1 sets confederate and tutorial step', () => {
    const refs = makeRefs();
    const { result } = renderHook(() => useTutorialSimulations(refs));

    act(() => {
      result.current.handleSimulation1();
    });

    expect(mockGame.setConfederate).toHaveBeenCalledWith('tutorial_confederate_1');
    expect(refs.setCurrentTutorialStep).toHaveBeenCalledWith(11);
    expect(refs.setCurrentUser).toHaveBeenCalledWith('tutorial_participant_1');
  });

  it('handleSimulation3 sets third confederate', () => {
    const refs = makeRefs();
    const { result } = renderHook(() => useTutorialSimulations(refs));

    act(() => {
      result.current.handleSimulation3();
    });

    expect(mockGame.setConfederate).toHaveBeenCalledWith('tutorial_confederate_3');
    expect(refs.setCurrentTutorialStep).toHaveBeenCalledWith(20);
  });
});
