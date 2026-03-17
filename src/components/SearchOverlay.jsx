import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, AlertTriangle, Activity, ChevronRight, Camera } from 'lucide-react';
import { ToolIcon } from '../lib/toolUtils';
import BarcodeScanner from './BarcodeScanner';

const SearchOverlay = ({ isOpen, onClose, tools, onSelectTool, isMobile }) => {
  const [manualCode, setManualCode] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setManualCode('');
      setShowCamera(false);
    }
  }, [isOpen]);

  const filteredTools = useMemo(() => {
    if (!manualCode || manualCode.length < 1) return [];
    const q = manualCode.toLowerCase();
    return (tools || []).filter(t => {
      const codice = (t['Codice'] || '').toLowerCase();
      const desc = (t['Descrizione'] || '').toLowerCase();
      const tipologia = (t['Tipologia'] || '').toLowerCase();
      const serialnumber = (t['SerialNumber'] || '').toLowerCase();
      const diametro = String(t['Diametro'] || '').toLowerCase();
      return codice.includes(q) || desc.includes(q) || tipologia.includes(q) || serialnumber.includes(q) || diametro.includes(q);
    }).slice(0, 50);
  }, [manualCode, tools]);

  const handleScan = (decodedText) => {
    setManualCode(decodedText);
    setShowCamera(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex flex-col items-center justify-start p-4 md:p-10"
        >
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose} 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" 
          />
          
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="w-full max-w-4xl z-10 flex flex-col gap-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Ricerca Globale</h2>
              <button 
                onClick={onClose} 
                className="glass-button p-4 rounded-full text-accent-orange"
              >
                <X size={24} />
              </button>
            </div>

            <div className="relative flex items-center gap-4">
              <div className="relative flex-1 flex items-center">
                <Search size={24} className="absolute left-6 text-slate-400 pointer-events-none z-10" />
                <input
                  ref={inputRef}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="CERCA PER CODICE, DESCRIZIONE, TIPO..."
                  className="w-full glass-panel py-6 pl-16 pr-14 rounded-[32px] font-bold text-xl outline-none border-accent-blue/20 focus:border-accent-blue/60 transition-all placeholder:text-slate-700 tracking-wider"
                />
                {manualCode && (
                  <button 
                    onClick={() => setManualCode('')} 
                    className="absolute right-6 text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
              
              <button 
                onClick={() => setShowCamera(!showCamera)}
                className={`glass-button p-6 rounded-[32px] ${showCamera ? 'text-accent-orange border-accent-orange/40' : 'text-accent-blue border-accent-blue/20'}`}
              >
                <Camera size={28} />
              </button>
            </div>

            {showCamera && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-panel rounded-[32px] overflow-hidden"
              >
                <BarcodeScanner onScan={handleScan} />
              </motion.div>
            )}

            <div className="flex-1 overflow-hidden flex flex-col">
              <AnimatePresence mode="wait">
                {manualCode.length > 0 && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="glass-panel rounded-[32px] overflow-hidden flex flex-col max-h-[60vh]"
                  >
                    <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-accent-cyan">
                        {filteredTools.length} risultat{filteredTools.length === 1 ? 'o' : 'i'} trovati
                      </p>
                    </div>
                    
                    <div className="overflow-y-auto custom-scrollbar flex-1">
                      {filteredTools.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                          <AlertTriangle size={48} className="mb-6 opacity-20" />
                          <p className="font-black text-lg uppercase tracking-widest">Nessun Risultato</p>
                        </div>
                      ) : (
                        filteredTools.map((tool, i) => (
                          <motion.div
                            key={tool.id || i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.02 }}
                            onClick={() => {
                              onSelectTool(tool);
                              onClose();
                            }}
                            className="flex items-center justify-between px-8 py-5 hover:bg-white/[0.04] cursor-pointer transition-all border-b border-white/[0.03] last:border-b-0 group"
                          >
                            <div className="flex items-center gap-5 flex-1 min-w-0">
                              <div className="flex-shrink-0 group-hover:scale-110 transition-transform">
                                <ToolIcon type={tool['Tipologia']} size={48} />
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <p className="font-black text-base text-white truncate uppercase tracking-tight">
                                  {tool['Tipologia']} {tool['Forma'] ? `— ${tool['Forma']}` : ''} Ø{tool['Diametro']}
                                </p>
                                <p className="text-[11px] font-bold text-slate-400 truncate mt-1 uppercase tracking-wider">
                                  {tool['Descrizione'] || `${tool['Tipologia']} ${tool['Forma'] || ''}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 flex-shrink-0 ml-6">
                              <span className="text-[10px] text-slate-300 font-mono">{tool['Ubicazione']}</span>
                              {!isMobile && <span className="badge badge-blue">{tool['Codice']}</span>}
                              <span className={`font-black text-sm tabular-nums ${(tool['Quantità'] || 0) > 0 ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                                {tool['Quantità'] || 0}
                              </span>
                              <ChevronRight size={18} className="text-slate-700 group-hover:text-accent-blue transition-colors" />
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;
