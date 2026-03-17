import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const BarcodeScanner = ({ onScan }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 150 },
      aspectRatio: 1.0,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.QR_CODE
      ],
      showFirstCameraScanButton: false,
      showTorchButtonIfSupported: true,
    };

    const scanner = new Html5QrcodeScanner("barcode-reader", config, false);

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear();
      },
      (error) => {
        // Silently ignore scan errors (they happen constantly while looking for a code)
      }
    );

    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner", error);
      });
    };
  }, [onScan]);

  return (
    <div className="w-full bg-black/20 p-4">
      <div id="barcode-reader" className="w-full overflow-hidden rounded-2xl border-none"></div>
      <p className="text-[10px] text-center mt-2 font-black uppercase tracking-widest text-slate-500">
        Inquadra il codice a barre o QR code
      </p>
    </div>
  );
};

export default BarcodeScanner;
