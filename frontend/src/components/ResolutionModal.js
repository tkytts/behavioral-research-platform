import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import Modal from "./Modal";
import { setGameResolution } from "../realtime/game";
import { RESOLUTION_TYPES } from "../constants/resolutionTypes";

function ResolutionModal({ isOpen, onClose, onResolved }) {
  const [teamAnswer, setTeamAnswer] = useState("");
  const [validationError, setValidationError] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) { setTeamAnswer(""); setValidationError(""); }
  }, [isOpen]);

  if (!isOpen) return null;

  const resolveGame = (gameResolutionType) => {
    const isTimeoutResolution = gameResolutionType === RESOLUTION_TYPES.TNP;
    if (!teamAnswer && !isTimeoutResolution) {
      setValidationError(t("please_provide_team_answer"));
      return;
    }
    setGameResolution({ gameResolutionType, teamAnswer: isTimeoutResolution ? "" : teamAnswer });
    if (onResolved) {
      onResolved(gameResolutionType);
    }
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <h2 id="resolution-modal-title" className="mb-3">
        {t("resolve_and_next")}
      </h2>
      <div className="mb-3">
        <label htmlFor="teamAnswer" className="form-label">
          {t("team_answer")}:
        </label>
        <input
          type="text"
          className={validationError ? "form-control is-invalid" : "form-control"}
          id="teamAnswer"
          data-testid="team-answer-input"
          value={teamAnswer}
          onChange={(e) => { setTeamAnswer(e.target.value); setValidationError(""); }}
        />
        {validationError && <div className="invalid-feedback">{validationError}</div>}
      </div>
      <div className="d-flex justify-content-between mb-3">
        <button className="btn btn-success" data-testid="btn-ap" onClick={() => resolveGame(RESOLUTION_TYPES.AP)}>
          {t("AP")}
        </button>
        <button className="btn btn-warning" data-testid="btn-anp" onClick={() => resolveGame(RESOLUTION_TYPES.ANP)}>
          {t("ANP")}
        </button>
        <button className="btn btn-primary" data-testid="btn-dp" onClick={() => resolveGame(RESOLUTION_TYPES.DP)}>
          {t("DP")}
        </button>
        <button className="btn btn-danger" data-testid="btn-dnp" onClick={() => resolveGame(RESOLUTION_TYPES.DNP)}>
          {t("DNP")}
        </button>
        <button className="btn btn-secondary" data-testid="btn-tnp" onClick={() => resolveGame(RESOLUTION_TYPES.TNP)}>
          {t("TNP")}
        </button>
      </div>
    </Modal>
  );
}

export default ResolutionModal;
