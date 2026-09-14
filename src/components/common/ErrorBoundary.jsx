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
        <div className="min-h-[100dvh] h-[100dvh] w-full flex flex-col items-center justify-center p-4 dark:bg-slate-950 bg-slate-50 text-slate-800 dark:text-slate-100">
          <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-[28px] sm:rounded-[36px] flex flex-col items-center text-center shadow-2xl border dark:border-white/10 border-slate-900/10 max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="w-16 h-16 rounded-2xl bg-accent-orange/20 flex items-center justify-center text-accent-orange mb-4 shadow-inner shrink-0">
              <AlertTriangle size={32} />
            </div>
            
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-orange mb-1">
              Sistema di Ripristino
            </p>
            <h2 className="text-xl sm:text-2xl font-black uppercase italic tracking-tight mb-2">
              Si è verificato un errore
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6">
              L'applicazione ha riscontrato un'anomalia. Puoi ricaricare la pagina o ripristinare la sessione di accesso.
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={this.handleReload}
                className="w-full py-3.5 px-4 rounded-xl sm:rounded-2xl bg-accent-blue text-slate-950 font-black text-xs uppercase tracking-widest hover:bg-sky-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 cursor-pointer"
              >
                <RefreshCw size={16} />
                <span>Ricarica Applicazione</span>
              </button>

              <button
                onClick={this.handleResetAndLogin}
                className="w-full py-3.5 px-4 rounded-xl sm:rounded-2xl glass-button text-slate-700 dark:text-slate-300 hover:text-accent-orange font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut size={16} />
                <span>Torna al Login</span>
              </button>
            </div>

            {/* Dettagli tecnici dell'errore consultabili e copiabili direttamente da mobile */}
            {error && (
              <div className="w-full mt-5 pt-4 border-t border-slate-900/10 dark:border-white/10 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="text-[11px] font-bold text-slate-500 hover:text-accent-blue flex items-center gap-1.5 transition-colors cursor-pointer py-1"
                >
                  <span>{showDetails ? 'Nascondi dettagli tecnici' : 'Mostra dettagli errore'}</span>
                  {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {showDetails && (
                  <div className="mt-3 w-full p-3 rounded-2xl bg-slate-950/90 text-slate-200 border border-white/10 text-left font-mono text-[10px] flex flex-col gap-2 shadow-inner">
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <span className="text-rose-400 font-bold truncate text-[11px]">
                        {String(error?.name || 'Error')}: {String(error?.message || error)}
                      </span>
                      <button
                        type="button"
                        onClick={this.handleCopyError}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-accent-blue flex items-center gap-1 shrink-0 active:scale-95 transition-all text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                        title="Copia errore negli appunti"
                      >
                        {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        <span>{copied ? 'Copiato' : 'Copia'}</span>
                      </button>
                    </div>

                    {error?.stack && (
                      <pre className="text-slate-400 whitespace-pre-wrap break-all text-[9px] max-h-36 overflow-y-auto custom-scrollbar leading-relaxed">
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
