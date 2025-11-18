import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { StatusBar, Style } from '@capacitor/status-bar';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

const enableEdgeToEdge = async () => {
  try {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setBackgroundColor({ color: '#00000000' });

    await StatusBar.setStyle({
      style: isDark ? Style.Dark : Style.Light, 
    });

    // Listen for theme changes (live update)
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', (event) => {
      StatusBar.setStyle({
        style: event.matches ? Style.Dark : Style.Light,
      });
    });

  } catch (err) {
    console.debug('StatusBar not available:', err);
  }
};

enableEdgeToEdge();


if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'NAVIGATE' && event.data.url) {
      window.focus();
      window.location.href = event.data.url;
    }
  });
}
