import { createContext, useContext, useState, useEffect } from "react";
import { getFeatures } from "../api/config";

const DEFAULTS = {
  dashboard: { active: true },
  scriptsModal: { active: true, typingWpm: 60 },
  notes: { active: true },
};

const FeatureToggleContext = createContext(DEFAULTS);

export function FeatureToggleProvider({ children }) {
  const [features, setFeatures] = useState(DEFAULTS);

  useEffect(() => {
    getFeatures()
      .then((data) => setFeatures((prev) => ({ ...prev, ...data })))
      .catch(() => {
        // Silently fall back to defaults — non-critical
      });
  }, []);

  return (
    <FeatureToggleContext.Provider value={features}>
      {children}
    </FeatureToggleContext.Provider>
  );
}

export function useFeatureActive(name) {
  return useContext(FeatureToggleContext)[name]?.active ?? true;
}

export function useFeatureConfig(name) {
  return useContext(FeatureToggleContext)[name] ?? {};
}
