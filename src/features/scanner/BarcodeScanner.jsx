import React, { useEffect, useRef, useState, useId, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw, Zap, ZapOff, ZoomIn, ZoomOut, CheckCircle2, X } from 'lucide-react';
import { initBarcodeDetector } from './setupBarcodeDetector';

// Pre-carica e registra il motore WebAssembly (C++20 SIMD) per la decodifica istantanea
initBarcodeDetector();

/**
 * Riproduce un bip acustico sintetico e cristallino all'avvenuta scansione
 * Utilizza Web Audio API nativo per funzionare al 100% offline senza file multimediali esterni.
 */
const playScanBeep = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Bitono positivo a frequenza armoniosa (880Hz -> 1760Hz)
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Silenzioso se le policy del browser bloccano l'audio
  }
};

const BarcodeScanner = ({ onScan, onClose }) => {
  const html5QrCodeRef = useRef(null);
  const videoTrackRef = useRef(null);
  const hasScannedRef = useRef(false);

  const reactId = useId();
  const scannerDomId = `barcode-reader-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Controlli Hardware Camera (Torcia e Zoom)
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isZoomSupported, setIsZoomSupported] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1);

  // Feedback visivo codice scansionato
  const [scannedCode, setScannedCode] = useState(null);

  // Toggle Torcia / Flash
  const toggleTorch = useCallback(async () => {
    if (!html5QrCodeRef.current) return;
    const nextTorch = !isTorchOn;

    try {
      let applied = false;
      // 1. Prova tramite le API Html5Qrcode
      try {
        const capabilities = html5QrCodeRef.current.getRunningTrackCameraCapabilities();
        if (capabilities && capabilities.torchFeature && capabilities.torchFeature().isSupported()) {
          await capabilities.torchFeature().apply(nextTorch);
          applied = true;
        }
      } catch {
        /* fallback sotto */
      }

      // 2. Prova tramite la traccia video nativa MediaStreamTrack
      if (!applied && videoTrackRef.current) {
        await videoTrackRef.current.applyConstraints({
          advanced: [{ torch: nextTorch }]
        });
        applied = true;
      }

      // 3. Prova tramite applyVideoConstraints generico
      if (!applied) {
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: nextTorch }]
        });
      }

      setIsTorchOn(nextTorch);
    } catch (err) {
      console.warn("Impossibile attivare la torcia:", err);
    }
  }, [isTorchOn]);

  // Toggle Zoom Rapido (1x / 2x)
  const toggleZoom = useCallback(async () => {
    if (!html5QrCodeRef.current) return;
    const nextZoom = currentZoom === 1 ? 2 : 1;

    try {
      let applied = false;
      // 1. Prova tramite le API Html5Qrcode
      try {
        const capabilities = html5QrCodeRef.current.getRunningTrackCameraCapabilities();
        if (capabilities && capabilities.zoomFeature && capabilities.zoomFeature().isSupported()) {
          const max = capabilities.zoomFeature().max() || 2;
          const targetZoom = Math.min(nextZoom, max);
          await capabilities.zoomFeature().apply(targetZoom);
          applied = true;
        }
      } catch {
        /* fallback sotto */
      }

      // 2. Prova tramite la traccia video nativa MediaStreamTrack
      if (!applied && videoTrackRef.current) {
        await videoTrackRef.current.applyConstraints({
          advanced: [{ zoom: nextZoom }]
        });
        applied = true;
      }

      // 3. Prova tramite applyVideoConstraints generico
      if (!applied) {
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ zoom: nextZoom }]
        });
      }

      setCurrentZoom(nextZoom);
    } catch (err) {
      console.warn("Impossibile modificare lo zoom:", err);
    }
  }, [currentZoom]);

  useEffect(() => {
    hasScannedRef.current = false;

    // Configurazione avanzata ottimizzata per codici industriali lineari e 2D
    const config = {
      fps: 12, // 12 fps: frequenza ideale per evitare thermal throttling e dare respiro alla CPU
      aspectRatio: 1.333333,
      // Area panoramica estesa: previene il taglio dei codici lunghi (Code 128 / Code 39)
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const width = Math.floor(Math.min(viewfinderWidth * 0.90, 480));
        const height = Math.floor(Math.min(viewfinderHeight * 0.65, 250));
        return {
          width: Math.max(width, 260),
          height: Math.max(height, 160)
        };
      },
      // Forzatura alta risoluzione per catturare le barre fini a distanza di fuoco nitido
      videoConstraints: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        focusMode: { ideal: "continuous" }
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
    // Inizializza con BarcodeDetector hardware nativo abilitato
    const html5QrCode = new Html5Qrcode(scannerDomId, {
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      },
      verbose: false
    });
    html5QrCodeRef.current = html5QrCode;

    // Gestione esito scansione con feedback multimediale immediato
    const handleSuccess = (decodedText) => {
      if (!isMounted || hasScannedRef.current) return;
      hasScannedRef.current = true;

      // 1. Audio Beep
      playScanBeep();

      // 2. Vibrazione Aptica
      if ("vibrate" in navigator) {
        try { navigator.vibrate([60, 40, 60]); } catch { /* ignore */ }
      }

      // 3. Visual Feedback
      setScannedCode(decodedText);

      // 4. Consegna risultato dopo un breve delay per mostrare il flash verde di successo
      setTimeout(() => {
        if (isMounted) {
          onScan(decodedText);
        }
      }, 280);
    };

    const startScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        let cameraConfig = { facingMode: "environment" };

        if (devices && devices.length > 0) {
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('posteriore')
          );
          cameraConfig = backCamera ? backCamera.id : devices[0].id;
        }

        await html5QrCode.start(
          cameraConfig,
          config,
          handleSuccess,
          () => {} // onError callback
        );

        if (!isMounted) {
          if (html5QrCode.isScanning) {
            await html5QrCode.stop();
            html5QrCode.clear();
          }
          return;
        }

        // Rileva capacità hardware della telecamera attiva
        setTimeout(() => {
          if (!isMounted) return;
          try {
            // Verifica traccia video diretta
            const videoEl = document.querySelector(`#${scannerDomId} video`);
            if (videoEl && videoEl.srcObject) {
              const tracks = videoEl.srcObject.getVideoTracks();
              if (tracks && tracks.length > 0) {
                const track = tracks[0];
                videoTrackRef.current = track;
                if (track.getCapabilities) {
                  const caps = track.getCapabilities();
                  if ('torch' in caps) setIsTorchSupported(true);
                  if ('zoom' in caps) setIsZoomSupported(true);
                }
              }
            }

            // Verifica anche tramite html5-qrcode API
            const caps = html5QrCode.getRunningTrackCameraCapabilities();
            if (caps) {
              if (caps.torchFeature && caps.torchFeature().isSupported()) {
                setIsTorchSupported(true);
              }
              if (caps.zoomFeature && caps.zoomFeature().isSupported()) {
                setIsZoomSupported(true);
              }
            }
          } catch (e) {
            console.warn("Impossibile verificare capacità avanzate fotocamera:", e);
          }
        }, 300);

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
    <div className="relative w-full h-full min-h-[300px] sm:min-h-[360px] flex items-center justify-center overflow-hidden bg-black select-none">
      {/* Target DOM per HTML5 QR Code */}
      <div 
        id={scannerDomId} 
        className="w-full h-full relative"
      />

      {/* Barra Comandi Rapidi Flottanti Superiori (Torcia, Zoom, Chiudi) */}
      {!error && (
        <div className="absolute top-3 inset-x-3 sm:inset-x-4 z-30 flex items-center justify-between pointer-events-auto">
          {/* Pulsante Torcia / Flash */}
          <div className="flex items-center gap-2">
            {isTorchSupported && (
              <button
                type="button"
                onClick={toggleTorch}
                aria-pressed={isTorchOn}
                aria-label={isTorchOn ? "Spegni torcia" : "Accendi torcia"}
                className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl backdrop-blur-md border flex items-center gap-1.5 text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer ${
                  isTorchOn 
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-amber-400/30' 
                    : 'bg-slate-950/70 text-white border-white/20 hover:bg-slate-900/90'
                }`}
              >
                {isTorchOn ? <Zap size={16} className="fill-current" /> : <ZapOff size={16} />}
                <span className="hidden sm:inline">{isTorchOn ? "Flash ON" : "Flash"}</span>
              </button>
            )}

            {/* Pulsante Zoom Rapido (1x / 2x) */}
            {isZoomSupported && (
              <button
                type="button"
                onClick={toggleZoom}
                aria-label={`Zoom attivo ${currentZoom}x, premi per cambiare`}
                className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl backdrop-blur-md border flex items-center gap-1.5 text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer ${
                  currentZoom > 1
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-cyan-500/30'
                    : 'bg-slate-950/70 text-white border-white/20 hover:bg-slate-900/90'
                }`}
              >
                {currentZoom > 1 ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
                <span>{currentZoom}x</span>
              </button>
            )}
          </div>

          {/* Pulsante Chiudi opzionale */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi fotocamera"
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-900/90 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>
      )}

      {/* Laser di Scansione Ottica Animato */}
      {!error && !scannedCode && (
        <motion.div 
          className="absolute left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_14px_#06b6d4] pointer-events-none z-20"
          animate={{ top: ['25%', '75%', '25%'] }}
          transition={{ duration: 2.0, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Reticoli Panoramici di Puntamento Ottico */}
      {!error && (
        <div className={`absolute inset-5 sm:inset-8 max-w-[500px] max-h-[260px] m-auto pointer-events-none z-10 flex flex-col justify-between transition-colors duration-200 ${
          scannedCode ? 'text-emerald-400' : 'text-cyan-400'
        }`}>
          <div className="flex justify-between w-full">
            <div className={`w-6 h-6 border-t-2 border-l-2 rounded-tl-lg transition-all ${
              scannedCode 
                ? 'border-emerald-400 shadow-[0_0_16px_#10b981]' 
                : 'border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
            }`} />
            <div className={`w-6 h-6 border-t-2 border-r-2 rounded-tr-lg transition-all ${
              scannedCode 
                ? 'border-emerald-400 shadow-[0_0_16px_#10b981]' 
                : 'border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
            }`} />
          </div>

          <div className="flex justify-between w-full">
            <div className={`w-6 h-6 border-b-2 border-l-2 rounded-bl-lg transition-all ${
              scannedCode 
                ? 'border-emerald-400 shadow-[0_0_16px_#10b981]' 
                : 'border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
            }`} />
            <div className={`w-6 h-6 border-b-2 border-r-2 rounded-br-lg transition-all ${
              scannedCode 
                ? 'border-emerald-400 shadow-[0_0_16px_#10b981]' 
                : 'border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
            }`} />
          </div>
        </div>
      )}

      {/* Pillola Guida Distanza / Feedback Scansione (Fisso in basso) */}
      {!error && (
        <div className="absolute bottom-3 inset-x-3 sm:inset-x-4 z-20 flex justify-center pointer-events-none">
          <AnimatePresence mode="wait">
            {scannedCode ? (
              <motion.div
                key="scanned-success"
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="px-4 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 backdrop-blur-md flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
              >
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span className="font-mono text-xs font-bold tracking-wider truncate max-w-[240px] sm:max-w-xs">
                  {scannedCode}
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="guidance-tip"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-white/15 text-slate-300 backdrop-blur-md text-[11px] sm:text-xs font-medium text-center shadow-lg max-w-sm"
              >
                <span>Distanza: <strong className="text-white font-semibold">15–25 cm</strong> · Se sfocato, allontana</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Overlay Errore Fotocamera */}
      {error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center bg-slate-950/95 backdrop-blur-md">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3 shadow-inner">
            <AlertCircle size={24} />
          </div>
          <p className="app-h3 text-white mb-1">Accesso Fotocamera Necessario</p>
          <p className="app-body text-slate-400 max-w-xs mb-4 leading-relaxed text-center">{error}</p>
          <button
            type="button"
            onClick={() => { setError(null); setRetryCount(c => c + 1); }}
            className="min-h-[44px] px-4 py-2 rounded-xl text-accent-cyan text-xs font-bold tracking-wider border border-cyan-400/30 flex items-center gap-1.5 hover:bg-cyan-400/10 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} /> Riprova
          </button>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
