import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAndLogin = () => {
    try {
      useAuthStore.getState().logout();
    } catch (e) {
      localStorage.removeItem('berc_user');
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] h-[100dvh] w-full flex flex-col items-center justify-center p-4 dark:bg-slate-950 bg-slate-50 text-slate-800 dark:text-slate-100">
          <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-[28px] sm:rounded-[36px] flex flex-col items-center text-center shadow-2xl border dark:border-white/10 border-slate-900/10">
            <div className="w-16 h-16 rounded-2xl bg-accent-orange/20 flex items-center justify-center text-accent-orange mb-4 shadow-inner">
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
                className="w-full py-3.5 px-4 rounded-xl sm:rounded-2xl bg-accent-blue text-slate-950 font-black text-xs uppercase tracking-widest hover:bg-sky-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
              >
                <RefreshCw size={16} />
                <span>Ricarica Applicazione</span>
              </button>

              <button
                onClick={this.handleResetAndLogin}
                className="w-full py-3.5 px-4 rounded-xl sm:rounded-2xl glass-button text-slate-700 dark:text-slate-300 hover:text-accent-orange font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                <span>Torna al Login</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
