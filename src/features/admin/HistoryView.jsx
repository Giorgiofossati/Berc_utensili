import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { buildDesc } from '../../lib/toolUtils';

const HistoryView = memo(({ history, setView }) => (
  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-6xl flex flex-col items-center gap-3 sm:gap-6 px-2 sm:px-4 overflow-y-auto custom-scrollbar pb-12">
    <div className="flex w-full justify-between items-center px-1">
      <div>
        <p className="app-overline text-accent-orange drop-shadow-md mb-0.5">Tracciamento Log</p>
        <h2 className="app-h1">Storico Movimenti</h2>
      </div>
      <button onClick={() => setView('home')} className="glass-panel px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-[14px] sm:rounded-[20px] font-bold text-xs sm:text-sm text-accent-blue flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all">
        <ArrowLeft size={16} /> Home
      </button>
    </div>

    <div className="glass-panel w-full rounded-[20px] sm:rounded-[32px] p-2 overflow-hidden flex flex-col max-h-[72vh]">
      <div className="overflow-y-auto overflow-x-hidden md:overflow-x-auto custom-scrollbar flex-1 px-1 sm:px-3 w-full">
        <table className="w-full premium-table border-separate border-spacing-y-1.5 sm:border-spacing-y-2.5">
          <thead className="sticky top-0 z-10 glass-panel bg-bg-main/95">
            <tr className="app-overline dark:text-slate-300 text-slate-700">
              <th className="py-2.5 sm:py-4 px-2.5 sm:px-6 rounded-l-[12px] sm:rounded-l-[16px] text-left">Data</th>
              <th className="py-2.5 sm:py-4 px-2 sm:px-4 text-left">Utensile</th>
              <th className="py-2.5 sm:py-4 px-2 sm:px-4 text-center">Flusso</th>
              <th className="py-2.5 sm:py-4 px-2 sm:px-4 text-center">QTY</th>
              <th className="py-2.5 sm:py-4 px-2.5 sm:px-6 rounded-r-[12px] sm:rounded-r-[16px] text-right hidden sm:table-cell">Operatore</th>
            </tr>
          </thead>
          <tbody>
            {(history || []).map(item => (
              <tr key={item.id} className="glass-panel hover:bg-white/[0.04]">
                <td className="px-2.5 sm:px-6 py-2 rounded-l-[12px] sm:rounded-l-[16px] app-caption whitespace-nowrap">
                  <span className="hidden sm:inline">{new Date(item.created_at).toLocaleString('it-IT')}</span>
                  <span className="inline sm:hidden">{new Date(item.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}</span>
                </td>
                <td className="px-2 sm:px-4 py-2">
                  <p className="app-h3 truncate max-w-[120px] sm:max-w-none">{buildDesc(item.Utensili_B1)}</p>
                  {item.Utensili_B1?.Codice && <span className="app-caption block mt-0.5 truncate">{item.Utensili_B1.Codice}</span>}
                </td>
                <td className="px-2 sm:px-4 py-2 text-center">
                  <span className={`badge text-[9px] font-black px-2 py-0.5 ${item.tipo_operazione === 'carico' ? 'badge-emerald' : 'badge-rose'}`}>
                    {item.tipo_operazione === 'carico' ? 'carico' : 'scarico'}
                  </span>
                </td>
                <td className={`px-2 sm:px-4 py-2 text-center app-qty-sm ${item.tipo_operazione === 'carico' ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                  {item.tipo_operazione === 'carico' ? '+' : '-'}{item.quantita}
                </td>
                <td className="px-2.5 sm:px-6 py-2 rounded-r-[12px] sm:rounded-r-[16px] app-caption uppercase font-bold text-right hidden sm:table-cell whitespace-nowrap">{item.operatore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </motion.div>
));

export default HistoryView;
