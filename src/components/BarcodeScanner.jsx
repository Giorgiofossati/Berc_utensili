import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const BarcodeScanner = ({ onScan }) => {
  const html5QrCodeRef = useRef(null);
  const scannerId = useRef(`barcode-reader-${Math.random().toString(36).substr(2, 9)}`);
  const [error, setError] = useState(null);

  useEffect(() => {
    const config = {
      fps: 15,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const width = Math.min(viewfinderWidth * 0.8, 300);
        const height = width * 0.6;
        return { width, height };
      },
      aspectRatio: 1.0,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.QR_CODE
      ],
    };

    const html5QrCode = new Html5Qrcode(scannerId.current);
    html5QrCodeRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          // Cerca una camera posteriore
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
              if ("vibrate" in navigator) {
                try { navigator.vibrate(200); } catch (e) {}
              }
              onScan(decodedText);
            },
            () => {}
          );
        } else {
          // Fallback se non riesce a listare i device
          await html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              if ("vibrate" in navigator) {
                try { navigator.vibrate(200); } catch (e) {}
              }
              onScan(decodedText);
            },
            () => {}
          );
        }
      } catch (err) {
        console.error("Errore avvio scanner:", err);
        setError("Impossibile accedere alla fotocamera. Verifica i permessi o prova a ricaricare.");
      }
    };

    // Un piccolo ritardo per assicurarsi che il DOM sia pronto
    const timer = setTimeout(startScanner, 100);

    return () => {
      clearTimeout(timer);
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().then(() => {
            html5QrCodeRef.current.clear();
          }).catch(err => console.error("Errore stop scanner:", err));
        }
      }
    };
  }, [onScan]);

  return (
    <div className="w-full bg-slate-900/60 p-4 md:p-6 flex flex-col items-center">
      <div 
        id={scannerId.current} 
        className="w-full rounded-[32px] overflow-hidden border-2 border-white/10 bg-black min-h-[250px] shadow-2xl relative"
      >
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 z-20">
            <p className="text-rose-400 font-bold uppercase tracking-tighter mb-2">Errore Camera</p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest leading-relaxed">{error}</p>
          </div>
        )}
      </div>
      
      {!error && (
        <>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-2 h-2 bg-accent-blue rounded-full animate-pulse" />
            <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-accent-blue">
              Scanner Ottico Attivo
            </p>
          </div>
          <p className="text-[8px] md:text-[9px] text-center mt-1 font-bold uppercase tracking-[0.2em] text-slate-500 max-w-[200px]">
            Inquadra il codice per il riconoscimento automatico
          </p>
        </>
      )}
    </div>
  );
};

export default BarcodeScanner;


