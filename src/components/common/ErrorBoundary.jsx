import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, LogOut, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useTutorialStore } from '../../store/useTutorialStore';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false,
      copied: false 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAndLogin = () => {
    try {
      useTutorialStore.getState().closeTutorial();
    } catch { /* ignore */ }

    try {
      useAuthStore.getState().logout();
    } catch {
      localStorage.removeItem('berc_user');
    }

    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Su mobile forza una navigazione reale con ricarica
    window.location.href = window.location.origin + '/';
    setTimeout(() => {
      window.location.reload();
    }, 50);
  };

  handleCopyError = () => {
    const { error, errorInfo } = this.state;
    const errorText = `[Error]: ${error?.name || 'Error'}: ${error?.message || error}\n\n[Stack]:\n${error?.stack || 'N/A'}\n\n[ComponentStack]:\n${errorInfo?.componentStack || 'N/A'}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(errorText).then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2500);
      }).catch(() => {});
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, showDetails, copied } = this.state;

      return (
        <div className="min-h-[100dvh] h-[100dvh] w-full flex flex-col items-center justify-center p-4 sm:p-6 dark:bg-slate-950 bg-slate-50 text-slate-800 dark:text-slate-100">
          <div className="w-full max-w-lg sm:max-w-xl glass-panel p-6 sm:p-8 rounded-2xl sm:rounded-3xl flex flex-col items-center text-center shadow-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 max-h-[92dvh] overflow-y-auto custom-scrollbar">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 mb-3 shadow-inner shrink-0">
              <AlertTriangle size={30} />
            </div>
            
            <p className="app-overline mb-1 text-slate-400">
              Sistema di Ripristino
            </p>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Si è verificato un errore
            </h2>
            <p className="app-body text-slate-600 dark:text-slate-400 max-w-md mb-6 text-xs sm:text-sm">
              L'applicazione ha riscontrato un'anomalia. Puoi ricaricare la pagina o ripristinare la sessione di accesso.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl action-btn action-btn-primary flex items-center justify-center gap-2 font-bold text-xs sm:text-sm cursor-pointer shadow-md min-h-[44px]"
              >
                <RefreshCw size={16} />
                <span>Ricarica Pagina</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetAndLogin}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl glass-button text-slate-700 dark:text-slate-300 hover:text-amber-500 border border-slate-200 dark:border-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
              >
                <LogOut size={16} />
                <span>Torna al Login</span>
              </button>
            </div>

            {/* Dettagli tecnici dell'errore consultabili e copiabili direttamente da mobile */}
            {error && (
              <div className="w-full mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="text-xs font-bold text-slate-500 hover:text-accent-blue flex items-center gap-1.5 transition-colors cursor-pointer py-1.5 min-h-[36px]"
                >
                  <span>{showDetails ? 'Nascondi dettagli tecnici' : 'Mostra dettagli tecnici'}</span>
                  {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showDetails && (
                  <div className="mt-3 w-full p-3.5 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 text-left font-mono text-xs flex flex-col gap-2 shadow-inner">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <span className="text-rose-400 font-bold truncate text-xs flex-1">
                        {String(error?.name || 'Error')}: {String(error?.message || error)}
                      </span>
                      <button
                        type="button"
                        onClick={this.handleCopyError}
                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-accent-blue flex items-center gap-1 shrink-0 active:scale-95 transition-all text-xs font-bold tracking-wider cursor-pointer min-h-[32px]"
                        title="Copia errore negli appunti"
                      >
                        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        <span>{copied ? 'Copiato' : 'Copia'}</span>
                      </button>
                    </div>

                    {error?.stack && (
                      <pre className="text-slate-400 whitespace-pre-wrap break-all text-xs max-h-48 overflow-y-auto custom-scrollbar leading-relaxed">
                        {error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
