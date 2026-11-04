import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@neondatabase/neon-js/ui/css';
import App from './App';
import { AuthPage } from './components/AuthPage';
import { NeonAuthProvider } from './components/NeonAuthProvider';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <NeonAuthProvider>
        <Routes>
          <Route path="/auth/:pathname" element={<AuthPage />} />
          <Route path="/*" element={<App />} />
        </Routes>
      </NeonAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
