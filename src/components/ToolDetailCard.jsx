import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowUp, ArrowDown, MapPin, Package, Hash, Info, Target, Layers, Ruler, Activity, Warehouse } from 'lucide-react';
import { ToolIcon } from '../lib/toolUtils';

const DetailItem = ({ icon: Icon, label, value, color = "text-accent-blue" }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex flex-col gap-1">
      <div className="flex items-center gap-2 opacity-50">
        {Icon && <Icon size={12} />}
        <p className="text-[9px] font-black uppercase tracking-widest">{label}</p>
      </div>
      <p className={`text-sm font-black uppercase truncate ${color}`}>{value}</p>
    </div>
  );
};

const ToolDetailCard = memo(({ tool, onClose, modalQty, setModalQty, handleMovement, isLoading }) => {
  if (!tool) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 20 }} 
        className="glass-panel w-full max-w-4xl max-h-[90vh] p-6 md:p-10 rounded-[40px] md:rounded-[56px] z-[1001] relative flex flex-col gap-6 md:gap-8 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border-white/10"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-3xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center overflow-hidden shadow-2xl">
              <ToolIcon type={tool?.['Tipologia']} size={70} className="md:hidden" />
              <ToolIcon type={tool?.['Tipologia']} size={120} className="hidden md:flex" />
            </div>
            <div className="flex flex-col">
              <p className="text-[10px] md:text-[12px] font-black text-accent-orange tracking-[0.4em] uppercase mb-1">Dettaglio Utensile</p>
              <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-white leading-tight">
                {tool['Tipologia']} <span className="text-accent-blue">Ø{tool['Diametro']}</span>
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="badge badge-blue text-[10px] px-3">{tool['Codice']}</span>
                {tool['Forma'] && <span className="badge bg-white/5 text-slate-400 text-[10px] border-white/5">{tool['Forma']}</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="glass-button w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center hover:rotate-90 transition-transform border-white/10 shrink-0 self-start md:self-center">
            <X size={28} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-accent-blue/5 border border-accent-blue/20 p-5 rounded-[28px] flex flex-col items-center justify-center text-center">
              <Package size={20} className="text-accent-blue mb-2" />
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Giacenza</p>
              <p className="text-3xl font-black text-white tabular-nums">{tool['Quantità'] || 0}</p>
            </div>
            <div className="bg-white/5 border border-white/5 p-5 rounded-[28px] flex flex-col items-center justify-center text-center">
              <MapPin size={20} className="text-accent-orange mb-2" />
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Ubicazione</p>
              <p className="text-xl font-black text-white truncate w-full px-2">{tool['Ubicazione'] || 'MAGAZZINO'}</p>
            </div>
            <div className="bg-white/5 border border-white/5 p-5 rounded-[28px] flex flex-col items-center justify-center text-center">
              <Target size={20} className="text-accent-emerald mb-2" />
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Materiale</p>
              <p className="text-xl font-black text-white truncate w-full px-2">{tool['Materiale'] || 'N/D'}</p>
            </div>
            <div className="bg-white/5 border border-white/5 p-5 rounded-[28px] flex flex-col items-center justify-center text-center">
              <Layers size={20} className="text-accent-rose mb-2" />
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Stato</p>
              <p className={`text-xl font-black truncate w-full px-2 ${tool['Stato'] === 'Disponibile' ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                {tool['Stato'] || 'OK'}
              </p>
            </div>
          </div>

          {/* Extended Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <DetailItem icon={Ruler} label="Lunghezza" value={tool['Lunghezza']} />
            <DetailItem icon={Hash} label="Passo" value={tool['Passo']} />
            <DetailItem icon={Info} label="Tolleranza" value={tool['Tolleranza']} />
            <DetailItem icon={Target} label="Angolo" value={tool['Angolo']} />
            <DetailItem icon={Layers} label="Rivestimento" value={tool['Rivestimento']} />
            <DetailItem icon={Warehouse} label="Fornitore" value={tool['Fornitore']} />
            <DetailItem icon={Activity} label="Lavorazione" value={tool['Lavorazione']} />
            <DetailItem icon={Package} label="S/N" value={tool['SerialNumber']} />
          </div>

          {/* Action Section */}
          <div className="mt-8 glass-panel p-6 md:p-8 rounded-[40px] border-white/10 bg-white/[0.02] relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-accent-orange/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
             
             <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
               {/* Quantity Control */}
               <div className="flex-1 flex flex-col items-center md:items-start gap-4">
                 <p className="text-[10px] font-black text-accent-orange uppercase tracking-[.4em] mb-2 opacity-80">Configura Quantità</p>
                 <div className="flex items-center gap-6">
                    <button 
                      disabled={isLoading}
                      onClick={() => setModalQty(Math.max(1, modalQty - 1))} 
                      className="w-16 h-16 glass-button rounded-2xl text-2xl font-black hover:scale-105 active:scale-95 transition-all text-accent-orange disabled:opacity-30"
                    > - </button>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={modalQty} 
                        onChange={(e) => setModalQty(Math.max(1, parseInt(e.target.value) || 1))} 
                        className="w-24 bg-transparent text-center text-5xl md:text-6xl font-black outline-none text-white tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                      />
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-accent-orange/40 rounded-full" />
                    </div>
                    <button 
                      disabled={isLoading}
                      onClick={() => setModalQty(modalQty + 1)} 
                      className="w-16 h-16 glass-button rounded-2xl text-2xl font-black hover:scale-105 active:scale-95 transition-all text-accent-orange disabled:opacity-30"
                    > + </button>
                 </div>
               </div>

               {/* Quick Actions */}
               <div className="flex gap-4 w-full md:w-auto">
                 <motion.button
                   whileHover={{ scale: 1.02, y: -2 }}
                   whileTap={{ scale: 0.98 }}
                   disabled={isLoading}
                   onClick={() => handleMovement('carico')}
                   className="flex-1 md:w-48 flex flex-col items-center justify-center py-6 rounded-[28px] font-black uppercase tracking-widest shadow-xl transition-all bg-accent-emerald text-slate-950 hover:bg-emerald-400 border-b-4 border-emerald-700 disabled:opacity-50"
                 >
                   <ArrowUp size={20} className="mb-2" />
                   <span className="text-sm">Carica</span>
                 </motion.button>

                 <motion.button
                   whileHover={{ scale: 1.02, y: -2 }}
                   whileTap={{ scale: 0.98 }}
                   disabled={isLoading}
                   onClick={() => handleMovement('scarico')}
                   className="flex-1 md:w-48 flex flex-col items-center justify-center py-6 rounded-[28px] font-black uppercase tracking-widest shadow-xl transition-all bg-accent-rose text-white hover:bg-rose-600 border-b-4 border-rose-800 disabled:opacity-50"
                 >
                   <ArrowDown size={20} className="mb-2" />
                   <span className="text-sm">Scarica</span>
                 </motion.button>
               </div>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

export default ToolDetailCard;
