import React, { useState } from 'react';
import { X, Send, ShoppingCart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { buildDesc } from '../../lib/toolUtils';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const OrderModal = ({ tool, onClose, currentUser }) => {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const dataToInsert = {
        tool_id: tool.id,
        quantita_richiesta: qty,
        note: note,
        stato: 'In Attesa',
        utente: currentUser ? `${currentUser.nome} ${currentUser.cognome}` : 'Admin',
      };

      const { error } = await supabase
        .from('ordini')
        .insert([dataToInsert]);

      if (error) {
        // Se la tabella non esiste, Supabase restituirà un errore che possiamo gestire per dare istruzioni all'utente.
        if (error.code === '42P01') {
           throw new Error("La tabella 'ordini' non esiste nel database. Contatta l'amministratore per crearla tramite Supabase (Codice: 42P01).");
        }
        throw error;
      }

      alert("Ordine creato con successo!");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Errore durante la creazione dell'ordine: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!tool) return null;

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} className="glass-panel w-[95vw] sm:w-full max-w-md flex flex-col rounded-[32px] z-[2501] bg-transparent border-none shadow-none overflow-hidden p-0 gap-0 focus:outline-none">
        <DialogTitle className="sr-only">Crea Ordine</DialogTitle>
        {/* Header */}
        <div className="flex items-center justify-between p-6 shrink-0 border-b dark:border-white/10 border-slate-900/10 bg-accent-orange/10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent-orange/20 flex items-center justify-center">
              <ShoppingCart className="text-accent-orange" size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-accent-orange">Riassortimento</p>
              <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white text-slate-900">Crea Ordine</h2>
            </div>
          </div>
          <Button variant="glass" size="icon" onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:rotate-90 transition-transform">
            <X size={20} />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-6">
          <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex flex-col gap-1 border border-slate-900/5 dark:border-white/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Utensile Selezionato</p>
            <p className="text-sm font-black dark:text-white text-slate-900 truncate">
              {buildDesc(tool)} {tool.Codice ? ` - ${tool.Codice}` : ''}
            </p>
          </div>

          <form id="order-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-70 text-slate-700 dark:text-slate-300">Quantità da ordinare *</label>
              <Input 
                type="number" 
                min="1" 
                required
                value={qty} 
                onChange={(e) => setQty(Number(e.target.value))} 
                className="w-full h-auto p-4 rounded-2xl font-black text-2xl text-center focus:border-accent-orange focus:ring-1 focus:ring-accent-orange transition-all" 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-70 text-slate-700 dark:text-slate-300">Note Aggiuntive (Opzionale)</label>
              <textarea 
                rows="3"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Urgenza, Fornitore preferito..."
                className="glass-input w-full p-4 rounded-2xl font-semibold text-sm focus:border-accent-orange focus:ring-1 focus:ring-accent-orange transition-all resize-none custom-scrollbar"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 shrink-0 bg-black/5 dark:bg-white/5 flex justify-end">
          <Button 
            type="submit" 
            form="order-form"
            disabled={isLoading}
            className="py-6 px-6 flex items-center gap-2 rounded-xl shadow-xl disabled:opacity-50 w-full justify-center bg-[#f97316] text-white hover:bg-[#ea580c]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send size={18} />
                <span className="font-black uppercase tracking-widest text-xs">Invia Ordine</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderModal;
