import { useMemo } from 'react';
import { useFilterStore } from '../store/useFilterStore';
import { useInventoryStore } from '../store/useInventoryStore';

export function useFilters() {
  const tools = useInventoryStore((state) => state.tools);
  
  const filterStack = useFilterStore((state) => state.filterStack);
  const setFilterStack = useFilterStore((state) => state.setFilterStack);
  const viewMode = useFilterStore((state) => state.viewMode);
  const setViewMode = useFilterStore((state) => state.setViewMode);
  const isSelectionMode = useFilterStore((state) => state.isSelectionMode);
  const handleSetIsSelectionMode = useFilterStore((state) => state.handleSetIsSelectionMode);
  const setIsSelectionMode = useFilterStore((state) => state.setIsSelectionMode);
  const selectedToolsIds = useFilterStore((state) => state.selectedToolsIds);
  const setSelectedToolsIds = useFilterStore((state) => state.setSelectedToolsIds);
  const toggleToolSelection = useFilterStore((state) => state.toggleToolSelection);
  const resetFilters = useFilterStore((state) => state.resetFilters);
  const handleSelectDiameter = useFilterStore((state) => state.handleSelectDiameter);
  
  const handleSelectOptionStore = useFilterStore((state) => state.handleSelectOption);

  const filteredByStack = useMemo(() => {
    let result = tools;
    filterStack.forEach(f => {
      if (!f.skipped) {
        result = result.filter(t => String(t[f.type]) === String(f.value));
      }
    });
    return result;
  }, [tools, filterStack]);

  const options = useMemo(() => {
    if (filterStack.length === 0) {
      const types = [...new Set(tools.map(t => t['Tipologia']))].filter(Boolean);
      types.sort((a, b) => {
        if (a.toUpperCase().includes('FRESA')) return -1;
        if (b.toUpperCase().includes('FRESA')) return 1;
        return a.localeCompare(b);
      });
      return types.map(v => ({ label: v, type: 'Tipologia', category: 'TIPOLOGIA' }));
    }
    if (filterStack.length === 1) {
      const shapes = [...new Set(filteredByStack.map(t => t['Forma']))].filter(Boolean);
      if (shapes.length === 0) return null;
      shapes.sort((a, b) => a.localeCompare(b));
      return shapes.map(v => ({ label: v, type: 'Forma', category: 'FORMA' }));
    }
    return null;
  }, [tools, filterStack, filteredByStack]);

  const diameters = useMemo(() => {
    if (filterStack.length < 2) return [];
    const diam = [...new Set(filteredByStack.map(t => t['Diametro']))].filter(Boolean);
    diam.sort((a, b) => {
      const na = parseFloat(a);
      const nb = parseFloat(b);
      return (!isNaN(na) && !isNaN(nb)) ? na - nb : String(a).localeCompare(String(b), undefined, { numeric: true });
    });
    return diam;
  }, [filteredByStack, filterStack]);

  const finalTools = useMemo(() => (filterStack.length < 3 ? [] : filteredByStack), [filteredByStack, filterStack]);
  const currentLevel = filterStack.length;

  const handleSelectOption = (opt) => handleSelectOptionStore(opt, tools);

  const breadcrumbText = filterStack.filter(f => !f.skipped).map(f => f.value).join(' / ');

  return {
    filterStack, setFilterStack,
    viewMode, setViewMode,
    isSelectionMode, handleSetIsSelectionMode, setIsSelectionMode,
    selectedToolsIds, setSelectedToolsIds, toggleToolSelection,
    filteredByStack, options, diameters, finalTools, currentLevel,
    handleSelectOption, handleSelectDiameter, resetFilters, breadcrumbText
  };
}

