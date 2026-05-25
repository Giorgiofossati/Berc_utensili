import { useState, useMemo, useCallback } from 'react';

export function useFilters(tools) {
  const [filterStack, setFilterStack] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedToolsIds, setSelectedToolsIds] = useState([]);

  const handleSetIsSelectionMode = useCallback((val) => {
    setIsSelectionMode(val);
    if (!val) {
      setSelectedToolsIds([]);
    }
  }, []);

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

  const handleSelectOption = useCallback((opt) => {
    setFilterStack(prev => {
      let nextStack = [...prev, { type: opt.type, value: opt.label }];
      const getFiltered = (stack) => {
        let res = tools;
        stack.forEach(f => { if (!f.skipped) res = res.filter(t => String(t[f.type]) === String(f.value)); });
        return res;
      };
      if (opt.type === 'Tipologia') {
        const shapes = [...new Set(getFiltered(nextStack).map(t => t['Forma']))].filter(Boolean);
        if (shapes.length === 0) nextStack.push({ type: 'Forma', value: 'N/A', skipped: true });
      }
      const lastFilter = nextStack[nextStack.length - 1];
      if (lastFilter.type === 'Forma') {
        const diameters = [...new Set(getFiltered(nextStack).map(t => t['Diametro']))].filter(Boolean);
        if (diameters.length === 0) nextStack.push({ type: 'Diametro', value: 'N/A', skipped: true });
      }
      return nextStack;
    });
  }, [tools]);

  const handleSelectDiameter = useCallback((d) => {
    setFilterStack(prev => [...prev, { type: 'Diametro', value: d }]);
  }, []);

  const resetFilters = useCallback(() => {
    setFilterStack([]);
  }, []);

  const toggleToolSelection = useCallback((id) => {
    setSelectedToolsIds(prev => prev.includes(id) ? prev.filter(toolId => toolId !== id) : [...prev, id]);
  }, []);

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
