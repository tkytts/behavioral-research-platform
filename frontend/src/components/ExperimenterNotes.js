import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "experimenter_notes";

function ExperimenterNotes({ currentBlockIndex, currentProblem, confederateName }) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState(() => localStorage.getItem(STORAGE_KEY) ?? "");
  const debounceTimerRef = useRef(null);
  const prevBlockRef = useRef(null);
  const prevProblemRef = useRef(null);

  useEffect(() => {
    if (prevBlockRef.current === null && prevProblemRef.current === null) {
      prevBlockRef.current = currentBlockIndex;
      prevProblemRef.current = currentProblem;
      return;
    }

    const blockChanged = currentBlockIndex !== prevBlockRef.current;
    const problemChanged = currentProblem !== prevProblemRef.current;

    if (blockChanged || problemChanged) {
      prevBlockRef.current = currentBlockIndex;
      prevProblemRef.current = currentProblem;

      const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const marker = `[${time} — ${t("notes_marker_block")} ${currentBlockIndex + 1} (${confederateName}), ${t("notes_marker_problem")} ${currentProblem + 1}]`;

      setNotes((prev) => {
        const updated = prev ? `${prev}\n${marker}\n` : `${marker}\n`;
        localStorage.setItem(STORAGE_KEY, updated);
        return updated;
      });
    }
  }, [currentBlockIndex, currentProblem, confederateName, t]);

  useEffect(() => {
    return () => {
      clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setNotes(value);
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, value);
    }, 500);
  };

  return (
    <div className="row mt-4">
      <div className="col-12">
        <div className="card p-3">
          <label htmlFor="experimenter-notes" className="form-label fw-semibold">
            {t("notes_label")}
          </label>
          <textarea
            id="experimenter-notes"
            className="form-control"
            rows={6}
            value={notes}
            onChange={handleChange}
            placeholder={t("notes_placeholder")}
          />
        </div>
      </div>
    </div>
  );
}

export default ExperimenterNotes;
