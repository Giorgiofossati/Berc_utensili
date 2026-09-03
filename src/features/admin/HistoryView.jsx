import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { buildDesc } from '../../lib/toolUtils';

const HistoryView = memo(({ history, setView }) => (
  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-6xl flex flex-col items-center gap-4 sm:gap-8 px-2 sm:px-4 overflow-y-auto custom-scrollbar pb-12">
    <div className="flex w-full justify-between items-center px-2">
      <div>
        <p className="text-[9px] sm:text-[10px] font-black tracking-[0.3em] sm:tracking-[0.5em] text-accent-orange uppercase drop-shadow-md mb-1">Tracciamento Log</p>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase italic tracking-tight">Storico Movimenti</h2>
      </div>
      <button onClick={() => setView('home')} className="glass-panel px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-[16px] sm:rounded-[24px] font-bold text-xs sm:text-sm text-accent-blue flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
        <ArrowLeft size={16} /> Home
      </button>
    </div>

    <div className="glass-panel w-full rounded-[24px] sm:rounded-[40px] p-2 overflow-hidden flex flex-col max-h-[68vh]">
      <div className="overflow-y-auto overflow-x-auto custom-scrollbar flex-1 px-2 sm:px-4">
        <table className="w-full premium-table border-separate border-spacing-y-2 sm:border-spacing-y-3 min-w-[500px]">
          <thead className="sticky top-0 z-10 glass-panel bg-bg-main/95">
            <tr className="text-[8px] sm:text-[9px] font-black dark:text-slate-300 text-slate-700 uppercase tracking-[0.25em] sm:tracking-[0.4em]">
              <th className="py-3 sm:py-5 px-4 sm:px-8 rounded-l-[16px] sm:rounded-l-[20px]">Data / Ora</th>
              <th className="py-3 sm:py-5 px-3 sm:px-6">Identificativo Utensile</th>
              <th className="py-3 sm:py-5 px-3 sm:px-6">Flusso</th>
              <th className="py-3 sm:py-5 px-3 sm:px-6">QTY</th>
              <th className="py-3 sm:py-5 px-4 sm:px-8 rounded-r-[16px] sm:rounded-r-[20px]">Operatore</th>
            </tr>
          </thead>
          <tbody>
            {(history || []).map(item => (
              <tr key={item.id} className="glass-panel hover:bg-white/[0.04]">
                <td className="px-4 sm:px-8 py-3 rounded-l-[16px] sm:rounded-l-[20px] dark:text-slate-400 text-slate-600 text-xs sm:text-sm font-mono whitespace-nowrap">{new Date(item.created_at).toLocaleString('it-IT')}</td>
                <td className="px-3 sm:px-6 py-3 font-bold text-sm sm:text-base">
                  {buildDesc(item.Utensili_B1)} 
                  {item.Utensili_B1?.Codice && <span className="text-[9px] sm:text-[10px] dark:text-slate-400 text-slate-600 block mt-0.5">Codice: {item.Utensili_B1.Codice}</span>}
                </td>
                <td className="px-3 sm:px-6 py-3">
                  <span className={`badge text-[9px] sm:text-[10px] ${item.tipo_operazione === 'carico' ? 'badge-emerald' : 'badge-rose'}`}>{item.tipo_operazione === 'carico' ? 'deposita' : 'preleva'}</span>
                </td>
                <td className={`px-3 sm:px-6 py-3 font-black text-lg sm:text-2xl tabular-nums ${item.tipo_operazione === 'carico' ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                  {item.tipo_operazione === 'carico' ? '+' : '-'}{item.quantita}
                </td>
                <td className="px-4 sm:px-8 py-3 rounded-r-[16px] sm:rounded-r-[20px] dark:text-slate-300 text-slate-700 font-bold uppercase text-[10px] sm:text-xs tracking-wider whitespace-nowrap">{item.operatore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </motion.div>
));

export default HistoryView;
