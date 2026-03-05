import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";

import ErrorBoundary from "./components/ErrorBoundary";
import FontSizeControls from "./components/FontSizeControls";
import LanguageSelector from "./components/LanguageSelector";
import { useFontSize } from "./hooks/useFontSize";

const Experimenter = lazy(() => import("./pages/Experimenter"));
const Tutorial = lazy(() => import("./pages/Tutorial"));
const Participant = lazy(() => import("./pages/Participant"));

function App() {
  const { increaseFontSize, decreaseFontSize } = useFontSize();

  return (
    <Router>
      <div
        className="font-size-controls"
        style={{ position: "fixed", top: "10px", right: "10px", zIndex: 1000, display: "flex", gap: "8px", alignItems: "center" }}
      >
        <FontSizeControls onIncrease={increaseFontSize} onDecrease={decreaseFontSize} />
        <LanguageSelector />
      </div>
      <ErrorBoundary>
        <Suspense fallback={<div>Loading…</div>}>
          <Routes>
            <Route path="/tutorial" element={<Tutorial />} />
            <Route path="/experimenter" element={<Experimenter />} />
            <Route path="/participant" element={<Participant />} />
            <Route path="/" element={<Navigate to="/tutorial" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
}

export default App;