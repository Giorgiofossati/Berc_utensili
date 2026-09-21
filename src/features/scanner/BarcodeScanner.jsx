import React, { useEffect, useRef, useState, useId } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';

const BarcodeScanner = ({ onScan }) => {
  const html5QrCodeRef = useRef(null);
  const reactId = useId();
  const scannerDomId = `barcode-reader-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const config = {
      fps: 20,
      aspectRatio: 1.333333,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const w = Math.min(viewfinderWidth * 0.85, 320);
        const h = Math.min(viewfinderHeight * 0.65, 200);
        return { width: Math.floor(w), height: Math.floor(h) };
      },
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.DATA_MATRIX
      ],
    };

    let isMounted = true;
    const html5QrCode = new Html5Qrcode(scannerDomId);
    html5QrCodeRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (devices && devices.length > 0) {
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('posteriore')
          );
          
          const cameraId = backCamera ? backCamera.id : devices[0].id;
          
          await html5QrCode.start(
            cameraId,
            config,
            (decodedText) => {
              if (!isMounted) return;
              if ("vibrate" in navigator) {
                try { navigator.vibrate(200); } catch { /* ignore */ }
              }
              onScan(decodedText);
            },
            () => {}
          );
        } else {
          await html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              if (!isMounted) return;
              if ("vibrate" in navigator) {
                try { navigator.vibrate(200); } catch { /* ignore */ }
              }
              onScan(decodedText);
            },
            () => {}
          );
        }

        if (!isMounted && html5QrCode.isScanning) {
          await html5QrCode.stop();
          html5QrCode.clear();
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Errore avvio scanner:", err);
        setError("Impossibile accedere alla fotocamera. Verifica i permessi del browser.");
      }
    };

    const timer = setTimeout(startScanner, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().then(() => {
              html5QrCodeRef.current.clear();
            }).catch(err => console.error("Errore stop scanner:", err));
          } else {
            html5QrCodeRef.current.clear();
          }
        } catch { /* ignore cleanup error */ }
      }
    };
  }, [onScan, scannerDomId, retryCount]);

  return (
    <div className="relative w-full h-full min-h-[260px] flex items-center justify-center overflow-hidden bg-black select-none">
      {/* Target DOM per HTML5 QR Code */}
      <div 
        id={scannerDomId} 
        className="w-full h-full relative"
      />

      {/* Laser di Scansione Ottica Animato */}
      {!error && (
        <motion.div 
          className="absolute left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_14px_#06b6d4] pointer-events-none z-20"
          animate={{ top: ['20%', '80%', '20%'] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Reticoli Angolari di Puntamento */}
      {!error && (
        <div className="absolute inset-8 sm:inset-10 pointer-events-none z-10 flex flex-col justify-between">
          <div className="flex justify-between w-full">
            <div className="w-5 h-5 border-t-2 border-l-2 border-cyan-400 rounded-tl-md shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
            <div className="w-5 h-5 border-t-2 border-r-2 border-cyan-400 rounded-tr-md shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
          </div>
          <div className="flex justify-between w-full">
            <div className="w-5 h-5 border-b-2 border-l-2 border-cyan-400 rounded-bl-md shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
            <div className="w-5 h-5 border-b-2 border-r-2 border-cyan-400 rounded-br-md shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
          </div>
        </div>
      )}

      {/* Overlay Errore Fotocamera */}
      {error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center bg-slate-950/95 backdrop-blur-md">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3 shadow-inner">
            <AlertCircle size={24} />
          </div>
          <p className="app-h3 text-white mb-1">Accesso Fotocamera Necessario</p>
          <p className="app-caption text-slate-400 max-w-xs mb-4 leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={() => { setError(null); setRetryCount(c => c + 1); }}
            className="glass-button px-4 py-2 rounded-xl text-accent-cyan text-xs font-bold uppercase tracking-wider border border-cyan-400/30 flex items-center gap-1.5 hover:bg-cyan-400/10 transition-colors"
          >
            <RefreshCw size={14} /> Riprova
          </button>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;


