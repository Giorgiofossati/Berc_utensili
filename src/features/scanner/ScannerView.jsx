import React, { useState, useMemo, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Activity, Search, X, AlertTriangle, ChevronRight, Camera } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useInventoryStore } from '../../store/useInventoryStore';
import { useMovementStore } from '../../store/useMovementStore';

const ScannerView = memo(({ setView, setShowMoveModal, isMobile }) => {
  const tools = useInventoryStore(state => state.tools);
  const setSelectedTool = useMovementStore(state => state.setSelectedTool);
  const setModalQty = useMovementStore(state => state.setModalQty);
  const setOpType = useMovementStore(state => state.setOpType);
  const [manualCode, setManualCode] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef(null);

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
    }).slice(0, 20);
  }, [manualCode, tools]);

  const isSearchMode = manualCode.length > 0;

  const handleSelectResult = useCallback((tool) => {
    setSelectedTool(tool);
    setOpType(null); // Ensure detail modal opens first
    setModalQty(1);
    setShowMoveModal(true);
  }, [setSelectedTool, setOpType, setModalQty, setShowMoveModal]);

  const handleScan = (decodedText) => {
    setManualCode(decodedText);
    setShowCamera(false);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-5xl w-full flex flex-col items-center gap-4 sm:gap-6 px-2 sm:px-4 overflow-y-auto custom-scrollbar pb-12">
      <div className="w-full flex justify-between items-center">
        <Button variant="glass" size="icon" onClick={() => setView('home')} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full text-accent-orange"><ArrowLeft size={18} /></Button>
        <div className="flex flex-col items-center">
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-accent-orange mb-1">Laser Recognition</p>
          <h2 className="text-2xl sm:text-4xl font-extrabold uppercase italic tracking-tight">Optical Scanner</h2>
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12" />
      </div>

      <AnimatePresence mode="wait">
        {!isSearchMode ? (
          <motion.div
            key="scanner-full"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-panel w-full rounded-[28px] sm:rounded-[48px] overflow-hidden relative border-accent-cyan/20 mb-2 sm:mb-4 flex-shrink-0"
            style={{ aspectRatio: isMobile ? '16/9' : '21/9', maxHeight: '320px' }}
          >
            <div className="absolute inset-x-0 top-4 sm:top-6 flex justify-center z-10">
              <div className="glass-panel px-4 sm:px-6 py-1.5 sm:py-2 rounded-full border-accent-cyan/40 bg-accent-cyan/5">
                <p className="text-[9px] sm:text-[10px] font-black text-accent-cyan tracking-widest uppercase flex items-center gap-2">
                  <Activity size={12} className="animate-pulse" /> Scanner Status: Active
                </p>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-2 sm:mt-4">
              <div className="w-40 h-40 sm:w-64 sm:h-64 border-2 border-accent-cyan/20 rounded-[28px] sm:rounded-[48px] relative overflow-hidden">
                <div className="scan-line"></div>
                <div className="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-t-4 border-l-4 border-accent-cyan rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-t-4 border-r-4 border-accent-cyan rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-b-4 border-l-4 border-accent-cyan rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-b-4 border-r-4 border-accent-cyan rounded-br-2xl" />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="w-full relative">
        <div className="relative flex items-center gap-2 sm:gap-4">
          <div className="relative flex-1 flex items-center">
            <Search size={18} className="absolute left-4 sm:left-6 dark:text-slate-300 text-slate-700 pointer-events-none z-10" />
            <Input
              ref={inputRef}
              autoFocus
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Digita codice o descrizione..."
              className="w-full h-auto glass-panel py-3.5 sm:py-5 pl-11 sm:pl-14 pr-10 sm:pr-14 rounded-[20px] sm:rounded-[24px] font-bold text-sm sm:text-lg outline-none border-accent-blue/20 focus:border-accent-blue/60 transition-all placeholder:text-slate-500 tracking-wide"
            />
            {manualCode && (
              <Button variant="ghost" size="icon" onClick={() => setManualCode('')} className="absolute right-2 sm:right-3 dark:text-slate-300 text-slate-700 hover:text-white transition-colors">
                <X size={16} />
              </Button>
            )}
          </div>
          <Button 
            variant="glass"
            onClick={() => setShowCamera(!showCamera)}
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-[18px] sm:rounded-[24px] flex-shrink-0 ${showCamera ? 'text-accent-orange border-accent-orange/40' : 'text-accent-blue border-accent-blue/20'}`}
          >
            <Camera size={20} className="sm:w-6 sm:h-6" />
          </Button>
        </div>
        
        {showCamera && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-panel w-full rounded-[32px] overflow-hidden mt-4"
          >
            <BarcodeScanner onScan={handleScan} />
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isSearchMode && (
          <motion.div
            key="search-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full glass-panel rounded-[32px] overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-cyan">
                <Search size={12} className="inline mr-2" />
                Ricerca Manuale — {filteredTools.length} risultat{filteredTools.length === 1 ? 'o' : 'i'}
              </p>
            </div>
            <div className="max-h-[45vh] overflow-y-auto custom-scrollbar">
              {filteredTools.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 dark:text-slate-400 text-slate-600">
                  <AlertTriangle size={32} className="mb-4 text-slate-700" />
                  <p className="font-bold text-sm uppercase tracking-widest">Nessun risultato trovato</p>
                  <p className="text-xs text-slate-700 mt-2">Prova con un altro codice o descrizione</p>
                </div>
              ) : (
                filteredTools.map((tool, i) => (
                  <motion.div
                    key={tool.id || i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleSelectResult(tool)}
                    className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.04] cursor-pointer transition-all border-b border-white/[0.03] last:border-b-0 group"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-blue/20 transition-colors">
                        <Activity size={16} className="text-accent-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm dark:text-white text-slate-900 truncate">
                          {tool['Tipologia']} {tool['Forma'] ? `— ${tool['Forma']}` : ''} Ø{tool['Diametro']}
                        </p>
                        <p className="text-[10px] dark:text-slate-300 text-slate-700 truncate mt-0.5">
                          {tool['Descrizione'] || `${tool['Tipologia']} ${tool['Forma'] || ''} ${tool['Materiale'] || ''}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span className="badge badge-blue text-[9px]">{tool['Codice']}</span>
                      <span className={`badge text-[9px] ${(tool['Quantità'] || 0) > 0 ? 'badge-emerald' : 'badge-rose'}`}>
                        QTY: {tool['Quantità'] || 0}
                      </span>
                      <span className="text-[10px] dark:text-slate-400 text-slate-600 font-mono">{tool['Ubicazione']}</span>
                      <ChevronRight size={14} className="text-slate-700 group-hover:text-accent-blue transition-colors" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default ScannerView;
