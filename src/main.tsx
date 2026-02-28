import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { AppProvider } from './context/AppContext';
import { App } from './components/App';

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>
);
