import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

function ScriptsPanel({ currentScript, chatBoxRef, typingWpm }) {
  const [areScriptsCollapsed, setAreScriptsCollapsed] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const scriptsContainerRef = useRef(null);
  const simulatingTimerRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => () => clearTimeout(simulatingTimerRef.current), []);

  useEffect(() => {
    clearTimeout(simulatingTimerRef.current);
    setIsSimulating(false);
    scriptsContainerRef.current?.querySelectorAll("details").forEach((el) => {
      el.open = false;
    });
    setAreScriptsCollapsed(true);
  }, [currentScript]);

  if (!currentScript) return null;

  const handleToggleAll = () => {
    const nextCollapsed = !areScriptsCollapsed;
    scriptsContainerRef.current?.querySelectorAll("details").forEach((el) => {
      el.open = !nextCollapsed;
    });
    setAreScriptsCollapsed(nextCollapsed);
  };

  const handleScriptMessageClick = (msg) => {
    if (isSimulating || !chatBoxRef.current) return;
    const delay = 60000 / (typingWpm * 5);
    setIsSimulating(true);
    chatBoxRef.current.startTypingSimulation(msg, delay);
    simulatingTimerRef.current = setTimeout(() => setIsSimulating(false), msg.length * delay + 50);
  };

  return (
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
  );
}

export default ScriptsPanel;
