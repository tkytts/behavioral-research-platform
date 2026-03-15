import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import ChatBox from "../components/ChatBox";
import GameBox from "../components/GameBox";
import Modal from "../components/Modal";
import { getCurrentUser } from "../api/users";
import { getSuggestions } from "../api/blocks";
import { getConfederatesStart, getScripts, getScriptForOrder } from "../data/confederates";
import {
  onTutorialDone,
  offTutorialDone,
  clearAnswer,
  nextProblem as invokeNextProblem,
  resetTimer,
  startTimer,
  stopTimer,
  startGame,
  setPointsAwarded,
  setMaxTime,
  setConfederate,
  setChimes,
  updateProblemSelection,
  clearChat,
  blockFinished,
  gameEnded,
  stopGame,
  telemetryEvent,
  setGameResolution
} from "../realtime/game";
import { RESOLUTION_TYPES } from "../constants/resolutionTypes";

function Experimenter() {
  const [confederateName, setConfederateName] = useState("");
  const [gender, setGender] = useState("F");
  const [showGameConfigModal, setShowGameConfigModal] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [pointsAwarded, setPointsAwardedState] = useState(7);
  const [maxTimeInput, setMaxTimeInput] = useState(90);
  const [confederatesFemaleStart, setConfederatesFemaleStart] = useState([]);
  const [confederatesMaleStart, setConfederatesMaleStart] = useState([]);
  const [enableMessageSentChimes, setEnableMessageSentChimes] = useState(true);
  const [enableMessageReceivedChimes, setEnableMessageReceivedChimes] = useState(true);
  const [enableTimerChimes, setEnableTimerChimes] = useState(true);
  const [teamAnswer, setTeamAnswer] = useState("");
  const [currentProblem, setCurrentProblem] = useState(0);
  const [currentParticipant, setCurrentParticipant] = useState(null);
  const [showTutorialCompleteModal, setShowTutorialCompleteModal] = useState(false);
  const [numTries, setNumTries] = useState(1);
  const [collectionEnded, setCollectionEnded] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [scripts, setScripts] = useState({});
  const [areScriptsCollapsed, setAreScriptsCollapsed] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [typingWpm, setTypingWpm] = useState(null);
  const scriptsContainerRef = useRef(null);
  const chatBoxRef = useRef(null);
  const { t } = useTranslation();

  const MAX_PROBLEMS_PER_BLOCK = 5;

  useEffect(() => {
    const handleDone = (tries) => {
      setNumTries(tries);
      setShowTutorialCompleteModal(true);
    };
    onTutorialDone(handleDone);
    return () => {
      offTutorialDone(handleDone);
    };
  }, []);

  useEffect(() => {
    const loadConfederates = async () => {
      try {
        const { femaleData = [], maleData = [] } = await getConfederatesStart() || {};
        setConfederatesFemaleStart(femaleData);
        setConfederatesMaleStart(maleData);
      } catch (error) {
        console.error("Error loading confederates data:", error);
      }
    };
    loadConfederates();
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetch("/config.json")
      .then((r) => r.json())
      .then((cfg) => setTypingWpm(cfg.typingWpm))
      .catch((e) => console.error("Failed to load config.json:", e));
  }, []);

  const handleScriptMessageClick = (msg) => {
    if (isSimulating || !chatBoxRef.current || typingWpm === null) return;
    const delay = 60000 / (typingWpm * 5);
    setIsSimulating(true);
    chatBoxRef.current.startTypingSimulation(msg, delay);
    setTimeout(() => setIsSimulating(false), msg.length * delay + 50);
  };

  useEffect(() => {
    const loadScripts = async () => {
      try {
        const data = await getScripts();
        setScripts(data);
      } catch (error) {
        console.error("Error loading scripts:", error);
      }
    };
    loadScripts();
  }, []);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const data = await getSuggestions();
        setSuggestions(data);
      } catch (error) {
        console.error("Error loading suggestions:", error);
      }
    };
    loadSuggestions();
  }, []);

  const handleToggleAll = () => {
    const nextCollapsed = !areScriptsCollapsed;
    scriptsContainerRef.current?.querySelectorAll("details").forEach((el) => {
      el.open = !nextCollapsed;
    });
    setAreScriptsCollapsed(nextCollapsed);
  };

  const openGameConfigModal = () => {
    setShowGameConfigModal(true);
    if (!confederateName) handleGenderChange(gender);
  };

  const closeGameConfigModal = () => setShowGameConfigModal(false);

  const fetchCurrentUser = async () => {
    try {
      const userData = await getCurrentUser();
      setCurrentParticipant(JSON.parse(userData));
    } catch (error) {
      console.error("Error fetching current user data:", error);
    }
  };

  const onNextProblemClick = () => {
    clearAnswer();
    setTeamAnswer("");

    if (currentProblem === MAX_PROBLEMS_PER_BLOCK - 1) {
      resetTimer();
      stopTimer();
      setCurrentProblem(0);
      setNextConfederate();
      openGameConfigModal();
      blockFinished();
    } else {
      setCurrentProblem(currentProblem + 1);
      invokeNextProblem();
      resetTimer();
      startTimer();
    }
  };

  function setNextConfederate() {
    const confederates = gender === "F" ? confederatesFemaleStart : confederatesMaleStart;
    const currentIndex = confederates.findIndex((c) => c.name === confederateName);
    const nextIndex = ((currentIndex >= 0 ? currentIndex : -1) + 1) % (confederates.length || 1);

    if (confederates.length === 0) return;

    if (nextIndex === 0) {
      gameEnded();
    } else {
      setConfederateName(confederates[nextIndex].name);
    }
  }

  const openResolutionModal = () => {
    setTeamAnswer("");
    setShowResolutionModal(true);
  };

  const closeResolutionModal = () => {
    setShowResolutionModal(false);
  };

  const handleGenderChange = (selectedGender) => {
    setGender(selectedGender);
    const pool = selectedGender === "F" ? confederatesFemaleStart : confederatesMaleStart;
    if (pool && pool.length > 0) {
      setConfederateName(pool[0].name);
    } else {
      setConfederateName("");
    }
  };

  const getConfederateOptions = () => {
    const list = gender === "F" ? confederatesFemaleStart : confederatesMaleStart;
    return list.map((confederate, index) => (
      <option key={index} value={confederate.name}>
        {confederate.name}
      </option>
    ));
  };

  const handleSave = () => {
    fetchCurrentUser();

    let confederateBlock;
    if (gender === "F") {
      confederateBlock = confederatesFemaleStart.findIndex((confederate) => confederate.name === confederateName);
    } else {
      confederateBlock = confederatesMaleStart.findIndex((confederate) => confederate.name === confederateName);
    }

    setCurrentProblem(0);

    setConfederate(confederateName);
    startGame();
    setPointsAwarded(pointsAwarded);
    setMaxTime(maxTimeInput);
    setChimes({
      messageSent: enableMessageSentChimes,
      messageReceived: enableMessageReceivedChimes,
      timer: enableTimerChimes
    });
    updateProblemSelection({
      blockIndex: confederateBlock,
      problemIndex: 0
    });
    clearChat();

    closeGameConfigModal();
  };

  const handleEndSession = () => {
    if (!window.confirm(t("end_collection_confirm"))) return;
    stopGame();
    clearChat();
    telemetryEvent({ action: "CollectionEnded", user: currentParticipant });
    gameEnded();
    setCollectionEnded(true);
  };

  const confederates = gender === "F" ? confederatesFemaleStart : confederatesMaleStart;
  const currentConfederateIndex = confederates.findIndex((c) => c.name === confederateName);
  const currentConfederate = confederates.find((c) => c.name === confederateName);
  const currentScript = getScriptForOrder(scripts, currentConfederate?.order);
  const expectedResolution = currentScript?.resolutions?.[currentProblem]?.resolution;
  const currentSuggestion = suggestions[currentConfederateIndex]?.[currentProblem];
  const isLastProblemOfLastBlock =
    currentProblem === MAX_PROBLEMS_PER_BLOCK - 1 &&
    currentConfederateIndex === confederates.length - 1;

  const resolveGame = (gameResolutionType) => {
    let isTimeoutResolution = gameResolutionType === RESOLUTION_TYPES.TNP;

    if (!teamAnswer && !isTimeoutResolution) {
      alert(t("please_provide_team_answer"));
      return;
    }
    setGameResolution({ gameResolutionType, teamAnswer: isTimeoutResolution ? "" : teamAnswer });
    closeResolutionModal();
  };

  return (
    <div className="container mt-4" style={{ overflow: "hidden" }}>
      <h1 className="text-center mb-4">{t("title")}</h1>

      <div className="row align-items-start">
        <div className="col-md-6">
          <div className="row">
            <ChatBox ref={chatBoxRef} currentUser={currentParticipant} isAdmin={true} disabled={false} className="col-12" />
          </div>
          <div className="mt-3 d-flex justify-content-center gap-2">
            <button className="btn btn-primary" onClick={openGameConfigModal}>
              {t("start_game")}
            </button>
            <button className="btn btn-warning" onClick={openResolutionModal}>
              {t("resolve_game")}
            </button>
            {!isLastProblemOfLastBlock && (
              <button className="btn btn-secondary" onClick={onNextProblemClick}>
                {t("next_problem")}
              </button>
            )}
            <button className="btn btn-danger" onClick={handleEndSession}>
              {t("end_collection")}
            </button>
          </div>
          {confederateName && (
            <div className="mt-3">
              <div className="card p-3">
                <div className="dashboard-stat">
                  <span className="dashboard-label">{t("dashboard_problem_label")}</span>
                  <span className="dashboard-value">{currentProblem + 1}</span>
                </div>
                {expectedResolution && (
                  <div className="dashboard-stat">
                    <span className="dashboard-label">{t("dashboard_expected_label")}</span>
                    <span className="dashboard-value" style={{ color: RESOLUTION_COLORS[expectedResolution] }}>
                      {t(expectedResolution)}
                    </span>
                  </div>
                )}
                {currentSuggestion && (
                  <div className="dashboard-stat">
                    <span className="dashboard-label">{t("dashboard_suggestion_label")}</span>
                    <span className="dashboard-value">{currentSuggestion}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="col-md-6">
          <div className="row">
            <GameBox isAdmin={true} className="col-12" />
          </div>
          {confederateName && currentScript && (
            <div className="mt-1">
              <div className="card p-3">
                <div className="scripts-modal-header">
                  <span>{t("scripts_modal_title")}</span>
                  <button className="btn btn-sm btn-outline-secondary" onClick={handleToggleAll}>
                    {areScriptsCollapsed ? t("scripts_expand_all") : t("scripts_collapse_all")}
                  </button>
                </div>
                <div className="scripts-modal" ref={scriptsContainerRef}>
                  {Object.entries(currentScript.message_groups).map(([groupKey, groupData]) => (
                    <details key={groupKey}>
                      <summary>{t(`script_group_${groupKey}`)}</summary>
                      <ul>
                        {groupData.messages.map((msg, i) => (
                          <li key={i} style={{ cursor: isSimulating ? "not-allowed" : "pointer" }}>
                            <button
                              onClick={() => handleScriptMessageClick(msg)}
                              style={{ cursor: "inherit", background: "none", border: "none", padding: 0, font: "inherit", textAlign: "left", width: "100%" }}
                            >
                              {msg}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {collectionEnded && (
        <div className="alert alert-success alert-dismissible mt-3" role="alert">
          {t("collection_ended_feedback")}
          <button type="button" className="btn-close" onClick={() => setCollectionEnded(false)} />
        </div>
      )}

      {showGameConfigModal && (
        <Modal>
          <h2 id="modal-title" className="mb-3">
            {t("game_configuration")}
          </h2>
          <label className="d-block mb-3">
            {t("starting_gender")}:
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                padding: "5px",
                border: "1px solid #ccc",
                borderRadius: "5px",
                backgroundColor: "#f9f9f9",
                marginTop: "5px"
              }}
            >
              <label style={{ display: "flex", alignItems: "center", gap: "5px", margin: "0" }}>
                <input
                  type="radio"
                  name="gender"
                  value="F"
                  checked={gender === "F"}
                  onChange={(e) => handleGenderChange(e.target.value)}
                />
                {t("female")}
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "5px", margin: "0" }}>
                <input
                  type="radio"
                  name="gender"
                  value="M"
                  checked={gender === "M"}
                  onChange={(e) => handleGenderChange(e.target.value)}
                />
                {t("male")}
              </label>
            </div>
          </label>
          <label className="d-block mb-3">
            {t("confederate_name")}:
            <select className="form-control mt-2" value={confederateName} onChange={(e) => setConfederateName(e.target.value)}>
              <option value="" disabled>
                {t("select_confederate_name")}
              </option>
              {getConfederateOptions()}
            </select>
          </label>
          <label className="d-block mb-3">
            {t("points_awarded")}:
            <input
              type="number"
              className="form-control"
              value={pointsAwarded}
              onChange={(e) => setPointsAwardedState(Number(e.target.value))}
            />
          </label>
          <label className="d-block mb-3">
            {t("max_time_seconds")}:
            <input
              type="number"
              className="form-control"
              value={maxTimeInput}
              onChange={(e) => setMaxTimeInput(Number(e.target.value))}
            />
          </label>
          <label className="d-block mb-3">
            {t("enable_chimes_for")}:
            <div className="checkbox-container">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="form-check-input checkbox-input"
                  checked={enableMessageReceivedChimes}
                  onChange={(e) => setEnableMessageReceivedChimes(e.target.checked)}
                />
                {t("message_received")}
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="form-check-input checkbox-input"
                  checked={enableMessageSentChimes}
                  onChange={(e) => setEnableMessageSentChimes(e.target.checked)}
                />
                {t("message_sent")}
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="form-check-input checkbox-input"
                  checked={enableTimerChimes}
                  onChange={(e) => setEnableTimerChimes(e.target.checked)}
                />
                {t("timer")}
              </label>
            </div>
          </label>
          <div className="d-flex justify-content-between">
            <button className="btn btn-success" onClick={handleSave}>
              {t("start")}
            </button>
            <button className="btn btn-danger" onClick={closeGameConfigModal}>
              {t("cancel")}
            </button>
          </div>
        </Modal>
      )}

      {showResolutionModal && (
        <Modal onClose={closeResolutionModal}>
          <h2 id="resolution-modal-title" className="mb-3">
            {t("resolve_and_next")}
          </h2>
          <div className="mb-3">
            <label htmlFor="teamAnswer" className="form-label">
              {t("team_answer")}:
            </label>
            <input
              type="text"
              className="form-control"
              id="teamAnswer"
              value={teamAnswer}
              onChange={(e) => setTeamAnswer(e.target.value)}
            />
          </div>
          <div className="d-flex justify-content-between mb-3">
            <button className="btn btn-success" onClick={() => resolveGame(RESOLUTION_TYPES.AP)}>
              {t("AP")}
            </button>
            <button className="btn btn-warning" onClick={() => resolveGame(RESOLUTION_TYPES.ANP)}>
              {t("ANP")}
            </button>
            <button className="btn btn-primary" onClick={() => resolveGame(RESOLUTION_TYPES.DP)}>
              {t("DP")}
            </button>
            <button className="btn btn-danger" onClick={() => resolveGame(RESOLUTION_TYPES.DNP)}>
              {t("DNP")}
            </button>
            <button className="btn btn-secondary" onClick={() => resolveGame(RESOLUTION_TYPES.TNP)}>
              {t("TNP")}
            </button>
          </div>
        </Modal>
      )}
      {showTutorialCompleteModal && (
        <Modal onClose={() => setShowTutorialCompleteModal(false)}>
          <h2>{t("tutorial_complete")}</h2>
          <p>{t("the_user_completed_the_tutorial_successfully")}</p>
          <p>{t("the_task_mastery_criterion_was_achieved_on_the_nth_try", { numTries: numTries })}</p>
        </Modal>
      )}
    </div>
  );
}

export default Experimenter;
