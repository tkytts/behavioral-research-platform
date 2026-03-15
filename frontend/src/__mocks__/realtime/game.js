// Mock for realtime/game.js
export const connectionReady = Promise.resolve();

// Event handlers
export const onTutorialDone = jest.fn();
export const offTutorialDone = jest.fn();
export const onStatusUpdate = jest.fn();
export const offStatusUpdate = jest.fn();
export const onNewConfederate = jest.fn();
export const offNewConfederate = jest.fn();
export const onShowEndModal = jest.fn();
export const offShowEndModal = jest.fn();
export const onReceiveMessage = jest.fn();
export const offReceiveMessage = jest.fn();
export const onTimerUpdate = jest.fn();
export const offTimerUpdate = jest.fn();
export const onSetAnswer = jest.fn();
export const offSetAnswer = jest.fn();
export const onGameResolved = jest.fn();
export const offGameResolved = jest.fn();
export const onProblemUpdate = jest.fn();
export const offProblemUpdate = jest.fn();
export const onUserTyping = jest.fn();
export const offUserTyping = jest.fn();
export const onChatCleared = jest.fn();
export const offChatCleared = jest.fn();
export const onChimesUpdated = jest.fn();
export const offChimesUpdated = jest.fn();
export const onReconnected = jest.fn();

// Commands
export const startGame = jest.fn().mockResolvedValue(undefined);
export const blockFinished = jest.fn().mockResolvedValue(undefined);
export const gameEnded = jest.fn().mockResolvedValue(undefined);
export const stopGame = jest.fn().mockResolvedValue(undefined);
export const nextProblem = jest.fn().mockResolvedValue(undefined);
export const resetTimer = jest.fn().mockResolvedValue(undefined);
export const startTimer = jest.fn().mockResolvedValue(undefined);
export const stopTimer = jest.fn().mockResolvedValue(undefined);
export const clearChat = jest.fn().mockResolvedValue(undefined);
export const clearAnswer = jest.fn().mockResolvedValue(undefined);
export const setPointsAwarded = jest.fn().mockResolvedValue(undefined);
export const setMaxTime = jest.fn().mockResolvedValue(undefined);
export const setConfederate = jest.fn().mockResolvedValue(undefined);
export const setChimes = jest.fn().mockResolvedValue(undefined);
export const updateProblemSelection = jest.fn().mockResolvedValue(undefined);
export const typing = jest.fn().mockResolvedValue(undefined);
export const sendMessage = jest.fn().mockResolvedValue(undefined);
export const setAnswer = jest.fn().mockResolvedValue(undefined);
export const resetPoints = jest.fn().mockResolvedValue(undefined);
export const tutorialProblem = jest.fn().mockResolvedValue(undefined);
export const tutorialDone = jest.fn().mockResolvedValue(undefined);
export const setParticipantName = jest.fn().mockResolvedValue(undefined);
export const getChimes = jest.fn().mockResolvedValue(undefined);
export const setGameResolution = jest.fn().mockResolvedValue(undefined);
export const telemetryEvent = jest.fn().mockResolvedValue(undefined);
export const saveNotes = jest.fn().mockResolvedValue(undefined);
