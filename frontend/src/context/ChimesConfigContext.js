import { createContext, useContext, useState, useEffect, useRef } from "react";

import {
  onChimesUpdated,
  offChimesUpdated,
  getChimes,
  setChimes,
  connectionReady
} from "../realtime/game";

const DEFAULT_CHIMES = {
  messageSent: true,
  messageReceived: true,
  timer: true,
};

const ChimesConfigContext = createContext({
  chimesConfig: DEFAULT_CHIMES,
  updateChimesConfig: () => {},
});

export function ChimesConfigProvider({ children }) {
  const [chimesConfig, setChimesConfig] = useState(DEFAULT_CHIMES);
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double-initialization in StrictMode
    if (initialized.current) return;
    initialized.current = true;

    const handleChimesUpdated = (data) => {
      // Ignore invalid payloads
      if (!data || typeof data !== "object") return;

      // Merge incoming partial updates into current state
      setChimesConfig((prev) => ({
        messageSent: typeof data.messageSent === "boolean" ? data.messageSent : prev.messageSent,
        messageReceived: typeof data.messageReceived === "boolean" ? data.messageReceived : prev.messageReceived,
        timer: typeof data.timer === "boolean" ? data.timer : prev.timer,
      }));
    };

    onChimesUpdated(handleChimesUpdated);

    // Request chimes once connection is ready
    connectionReady
      .then(() => getChimes())
      .catch((e) => console.warn("[ChimesConfigContext] Initial chimes fetch failed:", e.message));

    return () => {
      offChimesUpdated(handleChimesUpdated);
    };
  }, []);

  const updateChimesConfig = async (newConfig) => {
    setChimesConfig(newConfig);
    try {
      await setChimes(newConfig);
    } catch (e) {
      console.warn("[ChimesConfigContext] Chimes sync failed:", e.message);
    }
  };

  return (
    <ChimesConfigContext.Provider value={{ chimesConfig, updateChimesConfig }}>
      {children}
    </ChimesConfigContext.Provider>
  );
}

export function useChimesConfig() {
  return useContext(ChimesConfigContext) || { chimesConfig: DEFAULT_CHIMES, updateChimesConfig: () => {} };
}