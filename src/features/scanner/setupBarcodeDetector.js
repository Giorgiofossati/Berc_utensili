import { BarcodeDetector as PolyfillBarcodeDetector, prepareZXingModule } from 'barcode-detector/ponyfill';
import zxingWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

let isConfigured = false;

/**
 * Inizializza il motore di decodifica ad alte prestazioni basato su ZXing-C++ compilato in WebAssembly (WASM).
 * 
 * - Se il browser supporta già BarcodeDetector nativamente via hardware (es. Android Chrome con ML Kit),
 *   il motore nativo viene mantenuto intatto per massime prestazioni a costo zero.
 * - Su tutti gli altri browser (iOS Safari, Firefox, MacOS/Windows desktop) o ambienti offline,
 *   viene registrato il polyfill WASM compilato da C++20 con supporto nativo a:
 *   - LocalAverage Adaptive Binarizer (resistente a riflessi su metallo e oli)
 *   - tryRotate (scansione a qualsiasi inclinazione o diagonale)
 *   - tryInvert (scansione marcature laser e codici invertiti bianco su nero)
 *   - tryHarder (campionamento sub-pixel per codici piccoli o sbiaditi)
 * 
 * Il file WASM viene servito localmente tramite Vite/PWA per garantire funzionamento 100% offline.
 */
export const initBarcodeDetector = () => {
  if (isConfigured) return;
  isConfigured = true;

  try {
    // Configura il percorso di caricamento locale per il binario WebAssembly (100% offline)
    prepareZXingModule({
      overrides: {
        locateFile: (path, prefix) => {
          if (path && path.endsWith('.wasm')) {
            return zxingWasmUrl;
          }
          return prefix + path;
        },
      },
    });

    // Registra come BarcodeDetector globale se non presente nativamente nel browser
    if (typeof globalThis !== 'undefined' && !globalThis.BarcodeDetector) {
      globalThis.BarcodeDetector = PolyfillBarcodeDetector;
    }
  } catch (err) {
    console.warn("Impossibile pre-inizializzare il modulo WASM BarcodeDetector:", err);
  }
};
