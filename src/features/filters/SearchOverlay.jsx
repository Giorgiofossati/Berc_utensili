import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, AlertTriangle, Activity, ChevronRight, Camera } from 'lucide-react';
import { ToolIcon, buildDesc } from '../../lib/toolUtils';
import BarcodeScanner from '../scanner/BarcodeScanner';

const SearchOverlay = ({ isOpen, onClose, tools, onSelectTool, isMobile }) => {
  const [manualCode, setManualCode] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef(null);

  const handleClose = () => {
    setManualCode('');
    setShowCamera(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const filteredTools = useMemo(() => {
    if (!manualCode || manualCode.length < 1) return [];
    const q = manualCode.toLowerCase();
    return (tools || []).filter(t => {
      const codice = (t['Codice'] || '').toLowerCase();
      const desc = (t['Descrizione'] || '').toLowerCase();
      const tipologia = (t['Tipologia'] || '').toLowerCase();
      const serialnumber = (t['Serial Number'] || t['SerialNumber'] || '').toLowerCase();
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
          className="fixed inset-0 z-[1000] flex flex-col items-center justify-start p-3 sm:p-6 md:p-10 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] overflow-y-auto custom-scrollbar"
        >
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose} 
            className="fixed inset-0 dark:bg-slate-950/60 bg-slate-100/60 backdrop-blur-md" 
          />
          
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            className="w-full max-w-4xl z-10 flex flex-col gap-4 sm:gap-6 my-auto"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="app-overline text-accent-cyan mb-0.5">Quick Lookup</p>
                <h2 className="app-h2">Ricerca Globale</h2>
              </div>
              <button 
                onClick={handleClose} 
                className="glass-button p-2.5 sm:p-3.5 rounded-full text-accent-orange"
              >
                <X size={20} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="relative flex items-center gap-2 sm:gap-4">
              <div className="relative flex-1 flex items-center">
                <Search size={18} className="absolute left-4 sm:left-6 dark:text-slate-400 text-slate-600 pointer-events-none z-10" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={isMobile ? "Cerca codice, tipo..." : "Digita codice, descrizione o tipologia..."}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full glass-panel pl-11 sm:pl-14 pr-12 py-3.5 sm:py-4 rounded-2xl md:rounded-3xl border-white/10 dark:text-white text-slate-900 font-bold text-sm sm:text-base outline-none focus:border-accent-cyan/50 focus:ring-2 focus:ring-accent-cyan/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
                {manualCode && (
                  <button 
                    onClick={() => setManualCode('')}
                    className="absolute right-4 text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowCamera(!showCamera)}
                className={`glass-button p-3.5 sm:p-4 rounded-2xl md:rounded-3xl flex items-center justify-center transition-all ${
                  showCamera ? 'bg-accent-cyan text-slate-950 border-accent-cyan' : 'text-accent-cyan hover:bg-accent-cyan/10'
                }`}
                title="Scanner Fotocamera"
              >
                <Camera size={20} />
              </button>
            </div>

            <div className="relative min-h-[100px] flex flex-col">
              <AnimatePresence mode="wait">
                {showCamera ? (
                  <motion.div
                    key="camera-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-panel w-full rounded-2xl md:rounded-3xl overflow-hidden p-4 sm:p-6 border-accent-cyan/30 flex flex-col items-center gap-4"
                  >
                    <div className="w-full max-w-sm rounded-xl overflow-hidden bg-black/40 border border-white/10">
                      <BarcodeScanner onScan={handleScan} />
                    </div>
                    <p className="app-overline text-slate-400 text-center">
                      Inquadra il codice a barre con la fotocamera
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="results-list"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="glass-panel w-full rounded-2xl md:rounded-3xl overflow-hidden flex flex-col max-h-[50vh] border-white/10"
                  >
                    <div className="px-4 sm:px-6 py-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                      <p className="app-overline text-accent-cyan">
                        {filteredTools.length} risultat{filteredTools.length === 1 ? 'o' : 'i'} trovati
                      </p>
                    </div>
                    
                    <div className="overflow-y-auto custom-scrollbar flex-1">
                      {filteredTools.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                          <AlertTriangle size={36} className="mb-3 opacity-30" />
                          <p className="app-overline">Nessun Risultato</p>
                        </div>
                      ) : (
                        filteredTools.map((tool, i) => (
                          <motion.div
                            key={tool.id || i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.015 }}
                            onClick={() => {
                              onSelectTool(tool);
                              onClose();
                            }}
                            className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-white/[0.04] cursor-pointer transition-all border-b border-white/[0.03] last:border-b-0 group"
                          >
                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-accent-blue/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                <ToolIcon type={tool['Tipologia']} size={36} />
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <p className="app-h3 truncate">
                                  {buildDesc(tool)}
                                </p>
                                <p className="app-caption text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                  {tool['Descrizione'] || `${tool['Tipologia']} ${tool['Forma'] || ''}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-3">
                              {tool['Ubicazione'] && <span className="badge badge-orange app-caption font-bold px-2 py-0.5 hidden sm:inline-block">{tool['Ubicazione']}</span>}
                              {!isMobile && tool['Codice'] && <span className="badge badge-blue app-caption font-bold px-2 py-0.5">{tool['Codice']}</span>}
                              <span className={`app-qty-sm ${(tool['Quantità'] || 0) > 0 ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                                {tool['Quantità'] || 0}
                              </span>
                              <ChevronRight size={16} className="text-slate-500 group-hover:text-accent-blue transition-colors" />
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
