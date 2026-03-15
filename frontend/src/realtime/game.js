import connection, { connectionReady } from "../connection";

// Helper to register an event safely
const onSafe = (eventName, handler) => {
  if (!handler) {
    return;
  }
  connection.on(eventName, handler);
};

const offSafe = (eventName, handler) => {
  if (!handler) {
    return;
  }
  connection.off(eventName, handler);
};

// Helper to ensure connection is ready before invoking
const invokeWhenReady = async (method, ...args) => {
  await connectionReady;
  return connection.invoke(method, ...args);
};

// Events

// Tutorial
export const onTutorialDone = (handler) => onSafe("TutorialDone", handler);
export const offTutorialDone = (handler) => offSafe("TutorialDone", handler);

// Status
export const onStatusUpdate = (handler) => onSafe("StatusUpdate", handler);
export const offStatusUpdate = (handler) => offSafe("StatusUpdate", handler);

// Confederate
export const onNewConfederate = (handler) => onSafe("NewConfederate", handler);
export const offNewConfederate = (handler) => offSafe("NewConfederate", handler);

// End modal
export const onShowEndModal = (handler) => onSafe("ShowEndModal", handler);
export const offShowEndModal = (handler) => offSafe("ShowEndModal", handler);

// Messages
export const onReceiveMessage = (handler) => onSafe("ReceiveMessage", handler);
export const offReceiveMessage = (handler) => offSafe("ReceiveMessage", handler);

// Timer
export const onTimerUpdate = (handler) => onSafe("TimerUpdate", handler);
export const offTimerUpdate = (handler) => offSafe("TimerUpdate", handler);

// Answer
export const onSetAnswer = (handler) => onSafe("SetAnswer", handler);
export const offSetAnswer = (handler) => offSafe("SetAnswer", handler);

// Game resolution
export const onGameResolved = (handler) => onSafe("GameResolved", handler);
export const offGameResolved = (handler) => offSafe("GameResolved", handler);

// Problem
export const onProblemUpdate = (handler) => onSafe("ProblemUpdate", handler);
export const offProblemUpdate = (handler) => offSafe("ProblemUpdate", handler);

// Chat
export const onUserTyping = (handler) => onSafe("UserTyping", handler);
export const offUserTyping = (handler) => offSafe("UserTyping", handler);

export const onChatCleared = (handler) => onSafe("ChatCleared", handler);
export const offChatCleared = (handler) => offSafe("ChatCleared", handler);

// Chimes
export const onChimesUpdated = (handler) => onSafe("ChimesUpdated", handler);
export const offChimesUpdated = (handler) => offSafe("ChimesUpdated", handler);

// Reconnection handler
export const onReconnected = (handler) => {
  if (handler) {
    connection.onreconnected(handler);
  }
};

// Commands (invoke)

// Game flow
export const startGame = () => invokeWhenReady("StartGame");
export const blockFinished = () => invokeWhenReady("BlockFinished");
export const gameEnded = () => invokeWhenReady("GameEnded");
export const stopGame = () => invokeWhenReady("StopGame");

// Problem cycle
export const nextProblem = () => invokeWhenReady("NextProblem");
export const resetTimer = () => invokeWhenReady("ResetTimer");
export const startTimer = () => invokeWhenReady("StartTimer");
export const stopTimer = () => invokeWhenReady("StopTimer");

// Chat/answers
export const clearChat = () => invokeWhenReady("ClearChat");
export const clearAnswer = () => invokeWhenReady("ClearAnswer");

// Game config
export const setPointsAwarded = (points) => invokeWhenReady("SetPointsAwarded", points);
export const setMaxTime = (seconds) => invokeWhenReady("SetMaxTime", seconds);
export const setConfederate = (name) => invokeWhenReady("SetConfederate", name);
export const setChimes = (options) => invokeWhenReady("SetChimes", options);
export const updateProblemSelection = (payload) => invokeWhenReady("UpdateProblemSelection", payload);

// Messages and tutorial helpers
export const typing = (user) => invokeWhenReady("Typing", user);
export const sendMessage = (payload) => invokeWhenReady("SendMessage", payload);
export const setAnswer = (answer) => invokeWhenReady("SetAnswer", answer);
export const resetPoints = () => invokeWhenReady("ResetPoints");
export const tutorialProblem = (payload) => invokeWhenReady("TutorialProblem", payload);
export const tutorialDone = (numTries) => invokeWhenReady("TutorialDone", numTries);

// Participant helpers
export const setParticipantName = (name) => invokeWhenReady("SetParticipantName", name);
export const getChimes = () => invokeWhenReady("GetChimes");
export const getConfederate = () => invokeWhenReady("GetConfederate");

// Resolution
export const setGameResolution = (payload) => invokeWhenReady("SetGameResolution", payload);

// Telemetry
export const telemetryEvent = (payload) =>
  invokeWhenReady("TelemetryEvent", payload).catch((e) =>
    console.error("Telemetry error:", e)
  );

// Export connectionReady for components that need to wait
export { connectionReady };