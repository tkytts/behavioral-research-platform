import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import Modal from "./Modal";

function GameConfigModal({ isOpen, onClose, onSave, confederatesFemaleStart, confederatesMaleStart, initialConfederateName, initialGender, maxProblemsPerBlock = 5 }) {
  const [gender, setGender] = useState(initialGender || "F");
  const [confederateName, setConfederateName] = useState(initialConfederateName || "");
  const [pointsAwarded, setPointsAwarded] = useState(7);
  const [maxTimeInput, setMaxTimeInput] = useState(75);
  const [enableMessageSentChimes, setEnableMessageSentChimes] = useState(true);
  const [enableMessageReceivedChimes, setEnableMessageReceivedChimes] = useState(true);
  const [enableTimerChimes, setEnableTimerChimes] = useState(true);
  const [startingProblemIndex, setStartingProblemIndex] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return;
    const g = initialGender || "F";
    setGender(g);
    const pool = g === "F" ? confederatesFemaleStart : confederatesMaleStart;
    setConfederateName(initialConfederateName || pool?.[0]?.name || "");
    setStartingProblemIndex(0);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const handleGenderChange = (selectedGender) => {
    setGender(selectedGender);
    const pool = selectedGender === "F" ? confederatesFemaleStart : confederatesMaleStart;
    setConfederateName(pool?.[0]?.name || "");
  };

  const getConfederateOptions = () => {
    const list = gender === "F" ? confederatesFemaleStart : confederatesMaleStart;
    return (list || []).map((confederate, index) => (
      <option key={index} value={confederate.name}>
        {confederate.name}
      </option>
    ));
  };

  const handleSave = () => {
    onSave({
      confederateName,
      gender,
      pointsAwarded,
      maxTimeInput,
      chimes: {
        messageSent: enableMessageSentChimes,
        messageReceived: enableMessageReceivedChimes,
        timer: enableTimerChimes,
      },
      startingProblemIndex,
    });
  };

  return (
    <Modal>
      <div data-testid="config-modal">
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
            marginTop: "5px",
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: "5px", margin: "0" }}>
            <input
              type="radio"
              name="gender"
              value="F"
              data-testid="gender-female"
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
              data-testid="gender-male"
              checked={gender === "M"}
              onChange={(e) => handleGenderChange(e.target.value)}
            />
            {t("male")}
          </label>
        </div>
      </label>
      <label className="d-block mb-3">
        {t("confederate_name")}:
        <select className="form-control mt-2" data-testid="confederate-select" value={confederateName} onChange={(e) => setConfederateName(e.target.value)}>
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
          data-testid="points-input"
          value={pointsAwarded}
          onChange={(e) => setPointsAwarded(Number(e.target.value))}
        />
      </label>
      <label className="d-block mb-3">
        {t("max_time_seconds")}:
        <input
          type="number"
          className="form-control"
          data-testid="max-time-input"
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
      <label className="d-block mb-3">
        {t("starting_problem")}:
        <select
          className="form-control mt-2"
          data-testid="starting-problem-select"
          value={startingProblemIndex}
          onChange={(e) => setStartingProblemIndex(Number(e.target.value))}
        >
          {Array.from({ length: maxProblemsPerBlock }, (_, i) => i).map((i) => (
            <option key={i} value={i}>{i + 1}</option>
          ))}
        </select>
      </label>
      <div className="d-flex justify-content-between">
        <button className="btn btn-success" data-testid="config-start-btn" onClick={handleSave}>
          {t("start")}
        </button>
        <button className="btn btn-danger" data-testid="config-cancel-btn" onClick={onClose}>
          {t("cancel")}
        </button>
      </div>
      </div>
    </Modal>
  );
}

export default GameConfigModal;
