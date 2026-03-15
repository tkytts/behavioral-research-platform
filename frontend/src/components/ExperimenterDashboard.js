import React from "react";
import { useTranslation } from "react-i18next";

const RESOLUTION_COLORS = {
  AP: "#198754",
  ANP: "#ffc107",
  DP: "#0d6efd",
  DNP: "#dc3545",
  TNP: "#6c757d",
};

function ExperimenterDashboard({ currentProblem, currentScript, currentConfederateIndex, suggestions }) {
  const { t } = useTranslation();

  const expectedResolution = currentScript?.resolutions?.[currentProblem]?.resolution;
  const currentSuggestion = suggestions?.[currentConfederateIndex]?.[currentProblem];

  return (
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
  );
}

export default ExperimenterDashboard;
