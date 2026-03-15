import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/minimal-theme.css';
import { ChimesConfigProvider } from './context/ChimesConfigContext';
import { FeatureToggleProvider } from './context/FeatureToggleContext';
import './i18n';

if (process.env.NODE_ENV === 'development') {
  window.addEventListener('error', (event) => {
    if (
      event.message?.includes('WebSocket') &&
      event.filename?.includes('WebSocketClient')
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true); // capture phase — fires before webpack's listener
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <FeatureToggleProvider>
      <ChimesConfigProvider>
        <App />
      </ChimesConfigProvider>
    </FeatureToggleProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
