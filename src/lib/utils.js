import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formatta un numero secondo lo standard industriale Bercella:
 * - Separatore migliaia: spazio (' ')
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
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return decPart !== undefined && decimals > 0 ? `${formattedInt},${decPart}` : formattedInt;
}

/**
 * Formatta un importo in Euro con spazio per le migliaia e virgola decimale:
 * es: 14 520,00 € (con decimals=2)
 */
export function formatItalianCurrency(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return decimals > 0 ? `0,${'0'.repeat(decimals)} €` : '0 €';
  }
  const formatted = formatItalianNumber(value, decimals);
  return `${formatted} €`;
}
