import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from './context/ThemeContext';
import { initErrorReporter } from './utils/errorReporter';
import App from './App';
import './index.css';

// Initialize frontend error reporting (sends to backend debug API)
initErrorReporter();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
