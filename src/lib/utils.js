import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Separatore migliaia: thin space (U+2009, 0,2em) + word joiner (U+2060, impedisce l'a capo).
 * Lo spazio normale nei font monospace (Geist Mono) è largo quanto una cifra e
 * spezza visivamente il numero; il thin space resta stretto sia in Geist sia in Geist Mono.
 */
export const THOUSANDS_SEPARATOR = ' ⁠';

/**
 * Formatta un numero secondo lo standard industriale Bercella:
 * - Separatore migliaia: thin space (THOUSANDS_SEPARATOR)
 * - Separatore decimale: virgola (',')
 * es: 14 520,50 oppure 1 250
 */
export function formatItalianNumber(value, decimals = 0) {
  if (value === null || value === undefined || isNaN(value)) {
    return decimals > 0 ? `0,${'0'.repeat(decimals)}` : '0';
  }
  const num = Number(value);
  const fixed = num.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_SEPARATOR);
  return decPart !== undefined && decimals > 0 ? `${formattedInt},${decPart}` : formattedInt;
}

/**
 * Formatta un importo in Euro con spazio per le migliaia e virgola decimale:
 * es: 14 520,00 € (con decimals=2)
 */
export function formatItalianCurrency(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return decimals > 0 ? `0,${'0'.repeat(decimals)}${THOUSANDS_SEPARATOR}€` : `0${THOUSANDS_SEPARATOR}€`;
  }
  const formatted = formatItalianNumber(value, decimals);
  return `${formatted}${THOUSANDS_SEPARATOR}€`;
}
