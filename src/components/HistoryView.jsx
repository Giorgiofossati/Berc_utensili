import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const HistoryView = memo(({ history, setView }) => (
  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-6xl flex flex-col items-center gap-10">
    <div className="flex w-full justify-between items-end px-4">
      <div>
        <p className="text-[10px] font-black tracking-[0.5em] text-accent-orange uppercase drop-shadow-md mb-2">Tracciamento Log</p>
        <h2 className="text-5xl font-black uppercase italic tracking-tighter">Storico Movimenti</h2>
      </div>
      <button onClick={() => setView('home')} className="glass-panel px-8 py-4 rounded-[24px] font-bold text-accent-blue flex items-center gap-3">
        <ArrowLeft size={18} /> Home
      </button>
    </div>

    <div className="glass-panel w-full rounded-[48px] p-2 overflow-hidden max-h-[60vh] flex flex-col">
      <div className="overflow-y-auto scrollbar-hide flex-1 px-4">
        <table className="w-full premium-table border-separate border-spacing-y-4">
          <thead className="sticky top-0 z-10 glass-panel bg-bg-main/95">
            <tr className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">
              <th className="py-6 px-10 rounded-l-[24px]">Data / Ora Operazione</th>
              <th className="py-6 px-6">Identificativo Utensile</th>
              <th className="py-6 px-6">Flusso</th>
              <th className="py-6 px-6">QTY</th>
              <th className="py-6 px-10 rounded-r-[24px]">Operatore</th>
            </tr>
          </thead>
          <tbody>
            {(history || []).map(item => (
              <tr key={item.id} className="glass-panel hover:bg-white/[0.04]">
                <td className="px-10 rounded-l-[24px] text-slate-400 text-sm font-mono">{new Date(item.created_at).toLocaleString('it-IT')}</td>
                <td className="px-6 font-bold text-lg">{item.Utensili_B1?.Tipologia} Ø{item.Utensili_B1?.Diametro} <span className="text-[10px] text-slate-400 block">ID: {item.Utensili_B1?.Codice}</span></td>
                <td className="px-6">
                  <span className={`badge ${item.tipo_operazione === 'carico' ? 'badge-emerald' : 'badge-rose'}`}>{item.tipo_operazione}</span>
                </td>
                <td className={`px-6 font-black text-2xl tabular-nums ${item.tipo_operazione === 'carico' ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                  {item.tipo_operazione === 'carico' ? '+' : '-'}{item.quantita}
                </td>
                <td className="px-10 rounded-r-[24px] text-slate-300 font-bold uppercase text-xs tracking-widest">{item.operatore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </motion.div>
));

export default HistoryView;
