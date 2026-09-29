import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './lib/ThemeContext.jsx'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'
import { usePwaStore } from './store/usePwaStore'

// Inizializza il listener per la PWA e il controllo automatico degli aggiornamenti
usePwaStore.getState().initPwa()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
