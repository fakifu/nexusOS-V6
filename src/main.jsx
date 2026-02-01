import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext'; // 👈 Import du Provider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* On enveloppe l'App avec le AuthProvider */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
