import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useConnectionStatus } from "../hooks/useConnectionStatus";
import ChatBox from "../components/ChatBox";
import GameBox from "../components/GameBox";
import Modal from "../components/Modal";
import { fetchConfederate } from "../api/game";
import {
  onNewConfederate,
  offNewConfederate,
  onShowEndModal,
  offShowEndModal,
  setParticipantName,
  getChimes,
  startTimer
} from "../realtime/game";

function Participant() {
  const connectionStatus = useConnectionStatus();
  const [currentUser, setCurrentUser] = useState("");
  const currentUserRef = useRef("");
  const messageRef = useRef(null);
  const [usernameSet, setUsernameSet] = useState(false);
  const [confederateName, setConfederateName] = useState("");
  const [ready, setReady] = useState(false);
  const [showGameEndedModal, setShowGameEndedModal] = useState(false);
  const [pollErrorCount, setPollErrorCount] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    currentUserRef.current = currentUser;

    const handleNewConfederate = (name) => {
      messageRef.current?.blur();
      setConfederateName(name);
      setReady(false);
    };

    onNewConfederate(handleNewConfederate);

    const handleShowEndModal = () => {
      messageRef.current?.blur();
      setShowGameEndedModal(true);
    };

    onShowEndModal(handleShowEndModal);

    return () => {
      offNewConfederate(handleNewConfederate);
      offShowEndModal(handleShowEndModal);
    };
  }, [currentUser]);

  useEffect(() => {
    if (!usernameSet || confederateName) return;

    const id = setInterval(async () => {
      try {
        const name = await fetchConfederate();
        if (name) { setConfederateName(name); setPollErrorCount(0); }
      } catch (e) {
        setPollErrorCount(c => c + 1);
      }
    }, 3000);

    return () => clearInterval(id);
  }, [usernameSet, confederateName]);

  const handleSetUsername = (e) => {
    e.preventDefault();
    if (currentUser.trim() !== "") {
      setUsernameSet(true);
      setParticipantName(currentUser);
    }
  };

  const handleReady = () => {
    setReady(true);
    getChimes();
    startTimer();
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">{t('title')}</h1>
      {(connectionStatus === 'failed' || connectionStatus === 'reconnecting') && (
        <div className="alert alert-warning" role="alert">
          {t(connectionStatus === 'failed' ? 'connection_failed' : 'connection_reconnecting')}
        </div>
      )}

      {!usernameSet && (
        <div className="mb-4">
          <form onSubmit={handleSetUsername} className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder={t("your_name")}
              data-testid="name-input"
              value={currentUser}
              onChange={(e) => setCurrentUser(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" data-testid="name-submit">
              {t('set_name')}
            </button>
          </form>
        </div>
      )}

      {usernameSet && !confederateName && !showGameEndedModal && (
        <div className="modal" style={modalStyle} data-testid="waiting-modal">
          <div className="modal-content" style={modalContentStyle}>
            <p>{t('waiting_for_other_player')}</p>
            {pollErrorCount >= 5 && <p className="text-warning">{t('waiting_network_issue')}</p>}
          </div>
        </div>
      )}

      {usernameSet && confederateName && !ready && (
        <div className="modal" style={modalStyle} data-testid="confederate-modal">
          <div className="modal-content" style={modalContentStyle}>
            <p>{t('you_are_playing_with')}</p>
            <p className="h2"><b>{confederateName}</b></p>
            <p>{t('click_ready_when_you_are_ready_to_start_the_game')}</p>
            <button className="btn btn-primary btn-narrow" data-testid="ready-button" onClick={handleReady}>
              {t('ready')}
            </button>
          </div>
        </div>
      )}

      {usernameSet && (
        <div className="row">
          <ChatBox currentUser={currentUser} isAdmin={false} disabled={false} messageRef={messageRef} />
          <GameBox isAdmin={false} />
        </div>
      )}
      {showGameEndedModal && (
        <Modal>
          <div data-testid="end-modal">
            <h2>{t('thank_you_for_participating')}</h2>
            <p>{t('please_wait_for_the_researcher')}</p>
          </div>
        </Modal>)}
    </div>
  );
}

// Inline styles for the modal
const modalStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000
};

const modalContentStyle = {
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "10px",
  textAlign: "center"
};

export default Participant;
