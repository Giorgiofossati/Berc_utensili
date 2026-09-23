import { buildDesc } from './toolUtils';

/**
 * Normalizza una stringa per la ricerca (lowercase e rimozione accenti/spazi superflui)
 */
export function normalizeSearchText(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Genera l'indice di ricerca completo per un utensile
 */
export function generateSearchIndex(tool) {
  if (!tool) return '';
  const codice = String(tool['Codice'] || '').toLowerCase();
  const desc = String(tool['Descrizione Originale'] || tool['Descrizione'] || '').toLowerCase();
  const tipologia = String(tool['Tipologia'] || '').toLowerCase();
  const forma = String(tool['Forma'] || '').toLowerCase();
  const diametro = String(tool['Diametro'] || '').toLowerCase();
  const fornitore = String(tool['Fornitore'] || '').toLowerCase();
  const ubicazione = String(tool['Ubicazione'] || '').toLowerCase();
  const serialNumber = String(tool['Serial Number'] || tool['SerialNumber'] || '').toLowerCase();
  const alias = String(tool['Alias'] || '').toLowerCase();
  const materiale = String(tool['Materiale'] || '').toLowerCase();
  const rivestimento = String(tool['Rivestimento'] || '').toLowerCase();
  const fullDesc = buildDesc(tool).toLowerCase();

  // Varianti diametro
  const diamWithD = diametro.replace(/^[øØ]/, 'd');
  const diamWithO = diametro.replace(/^[dD]/, 'ø');
  const diamBare = diametro.replace(/^[øØdD]/, '');
  const diamComma = diametro.replace('.', ',');
  const diamDot = diametro.replace(',', '.');

  return `${codice} ${desc} ${tipologia} ${forma} ${diametro} ${diamWithD} ${diamWithO} ${diamBare} ${diamComma} ${diamDot} ${fornitore} ${ubicazione} ${serialNumber} ${alias} ${materiale} ${rivestimento} ${fullDesc}`.toLowerCase();
}

/**
 * Verifica se un singolo termine di ricerca corrisponde all'indice,
 * con tolleranza automatica per Ø/D e separatori decimali virgola/punto.
 */
function termMatchesIndex(term, index) {
  if (index.includes(term)) return true;

  // Tolleranza virgola/punto decimale (es. 4,5 <-> 4.5)
  if (term.includes(',') && index.includes(term.replace(/,/g, '.'))) return true;
  if (term.includes('.') && index.includes(term.replace(/\./g, ','))) return true;

  // Tolleranza simbolo diametro Ø <-> D (es. ø16 <-> d16)
  if (/^[øØ]/.test(term) && index.includes(term.replace(/^[øØ]/, 'd'))) return true;
  if (/^[dD]/.test(term) && index.includes(term.replace(/^[dD]/, 'ø'))) return true;

  // Tolleranza numero puro per diametro (es. se cerco "16", trova d16)
  if (/^\d+(?:[.,]\d+)?$/.test(term)) {
    if (index.includes(`d${term}`) || index.includes(`ø${term}`)) return true;
  }

  return false;
}

/**
 * Verifica se un utensile corrisponde alla query di ricerca multi-termine
 * @param {Object} tool
 * @param {string} query
 * @returns {boolean}
 */
export function toolMatchesQuery(tool, query) {
  if (!query || !query.trim()) return true;

  const cleanQuery = normalizeSearchText(query);
  const terms = cleanQuery.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const index = tool._searchIndex || generateSearchIndex(tool);

  return terms.every(term => termMatchesIndex(term, index));
}
