import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useFeatureActive, useFeatureConfig } from "../context/FeatureToggleContext";

import ChatBox from "../components/ChatBox";
import GameBox from "../components/GameBox";
import Modal from "../components/Modal";
import ExperimenterNotes from "../components/ExperimenterNotes";
import ExperimenterDashboard from "../components/ExperimenterDashboard";
import ScriptsPanel from "../components/ScriptsPanel";
import GameConfigModal from "../components/GameConfigModal";
import ResolutionModal from "../components/ResolutionModal";
import { getCurrentUser } from "../api/users";
import { getSuggestions } from "../api/blocks";
import { getConfederatesStart, getScriptForOrder } from "../data/confederates";
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
  saveNotes
} from "../realtime/game";

function Experimenter() {
  const [confederateName, setConfederateName] = useState("");
  const [gender, setGender] = useState("F");
  const [showGameConfigModal, setShowGameConfigModal] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [confederatesFemaleStart, setConfederatesFemaleStart] = useState([]);
  const [confederatesMaleStart, setConfederatesMaleStart] = useState([]);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [currentParticipant, setCurrentParticipant] = useState(null);
  const [showTutorialCompleteModal, setShowTutorialCompleteModal] = useState(false);
  const [numTries, setNumTries] = useState(1);
  const [collectionEnded, setCollectionEnded] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const showDashboard = useFeatureActive("dashboard");
  const showScripts = useFeatureActive("scriptsModal");
  const showNotes = useFeatureActive("notes");
  const [notesClearKey, setNotesClearKey] = useState(0);
  const { typingWpm: configTypingWpm } = useFeatureConfig("scriptsModal");
  const [currentScript, setCurrentScript] = useState(null);

  useEffect(() => {
    const confederatesList = gender === "F" ? confederatesFemaleStart : confederatesMaleStart;
    const confederate = confederatesList.find((c) => c.name === confederateName);
    if (!confederate?.order) {
      setCurrentScript(null);
      return;
    }
    const loadScript = async () => {
      try {
        const data = await getScriptForOrder(confederate.order);
        setCurrentScript(data);
      } catch (error) {
        console.error("Error loading script:", error);
      }
    };
    loadScript();
  }, [confederateName, gender, confederatesFemaleStart, confederatesMaleStart]);
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

  const openGameConfigModal = () => setShowGameConfigModal(true);

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

  const openResolutionModal = () => setShowResolutionModal(true);
  const closeResolutionModal = () => setShowResolutionModal(false);

  const handleSave = ({ confederateName: newName, gender: newGender, pointsAwarded, maxTimeInput, chimes }) => {
    setConfederateName(newName);
    setGender(newGender);
    fetchCurrentUser();

    const list = newGender === "F" ? confederatesFemaleStart : confederatesMaleStart;
    const confederateBlock = list.findIndex((c) => c.name === newName);

    setCurrentProblem(0);

    setConfederate(newName);
    startGame();
    setPointsAwarded(pointsAwarded);
    setMaxTime(maxTimeInput);
    setChimes(chimes);
    updateProblemSelection({
      blockIndex: confederateBlock,
      problemIndex: 0
    });
    clearChat();

    closeGameConfigModal();
  };

  const handleEndSession = () => {
    if (!window.confirm(t("end_collection_confirm"))) return;
    const notesContent = localStorage.getItem("experimenter_notes") ?? "";
    if (notesContent.trim()) {
      saveNotes(notesContent);
    }
    localStorage.removeItem("experimenter_notes");
    setNotesClearKey((k) => k + 1);
    stopGame();
    clearChat();
    telemetryEvent({ action: "CollectionEnded", user: currentParticipant });
    gameEnded();
    setCollectionEnded(true);
  };

  const confederates = gender === "F" ? confederatesFemaleStart : confederatesMaleStart;
  const currentConfederateIndex = confederates.findIndex((c) => c.name === confederateName);
  const isLastProblemOfLastBlock =
    currentProblem === MAX_PROBLEMS_PER_BLOCK - 1 &&
    currentConfederateIndex === confederates.length - 1;

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
          {confederateName && showDashboard && (
            <ExperimenterDashboard
              currentProblem={currentProblem}
              currentScript={currentScript}
              currentConfederateIndex={currentConfederateIndex}
              suggestions={suggestions}
            />
          )}
        </div>
        <div className="col-md-6">
          <div className="row">
            <GameBox isAdmin={true} className="col-12" />
          </div>
          {confederateName && showScripts && (
            <ScriptsPanel
              currentScript={currentScript}
              chatBoxRef={chatBoxRef}
              typingWpm={configTypingWpm}
            />
          )}
        </div>
      </div>
      {showNotes && (
        <ExperimenterNotes
          key={notesClearKey}
          currentBlockIndex={currentConfederateIndex}
          currentProblem={currentProblem}
          confederateName={confederateName}
        />
      )}
      {collectionEnded && (
        <div className="alert alert-success alert-dismissible mt-3" role="alert">
          {t("collection_ended_feedback")}
          <button type="button" className="btn-close" onClick={() => setCollectionEnded(false)} />
        </div>
      )}

      <GameConfigModal
        isOpen={showGameConfigModal}
        onClose={closeGameConfigModal}
        onSave={handleSave}
        confederatesFemaleStart={confederatesFemaleStart}
        confederatesMaleStart={confederatesMaleStart}
        initialConfederateName={confederateName}
        initialGender={gender}
      />

      <ResolutionModal isOpen={showResolutionModal} onClose={closeResolutionModal} />
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
