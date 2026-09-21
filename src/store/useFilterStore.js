import { create } from 'zustand';

export const useFilterStore = create((set) => ({
  filterStack: [],
  viewMode: (() => {
    try {
      const userStr = localStorage.getItem('berc_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const savedView = localStorage.getItem(`berc_viewMode_${user.id}`);
        if (savedView) return savedView;
        if (user.ruolo === 'Admin') return 'dropdown';
      }
    } catch { /* ignore */ }
    return 'grid';
  })(),
  isSelectionMode: false,
  selectedToolsIds: [],
  searchQuery: '',
  
  setSearchQuery: (query) => set((state) => {
    if (state.searchQuery === query) return state;
    return { searchQuery: query };
  }),
  clearSearchQuery: () => set((state) => {
    if (!state.searchQuery) return state;
    return { searchQuery: '' };
  }),
  
  setFilterStack: (stackOrCallback) => set((state) => {
    const nextStack = typeof stackOrCallback === 'function' ? stackOrCallback(state.filterStack) : stackOrCallback;
    return { filterStack: nextStack };
  }),
  setViewMode: (mode) => set((state) => {
    if (state.viewMode === mode) return state;
    return { viewMode: mode };
  }),
  setIsSelectionMode: (val) => set(() => {
    if (!val) {
      return { isSelectionMode: val, selectedToolsIds: [] };
    }
    return { isSelectionMode: val };
  }),
  handleSetIsSelectionMode: (val) => set(() => {
    if (!val) {
      return { isSelectionMode: val, selectedToolsIds: [] };
    }
    return { isSelectionMode: val };
  }),
  setSelectedToolsIds: (idsOrCallback) => set((state) => ({
    selectedToolsIds: typeof idsOrCallback === 'function' ? idsOrCallback(state.selectedToolsIds) : idsOrCallback
  })),
  toggleToolSelection: (id) => set((state) => ({
    selectedToolsIds: state.selectedToolsIds.includes(id)
      ? state.selectedToolsIds.filter(toolId => toolId !== id)
      : [...state.selectedToolsIds, id]
  })),
  resetFilters: () => set((state) => {
    if (state.filterStack.length === 0) return state;
    return { filterStack: [] };
  }),
  handleSelectDiameter: (d) => set((state) => ({
    filterStack: [...state.filterStack, { type: 'Diametro', value: d }]
  })),
  handleSelectOption: (opt, tools) => set((state) => {
    let nextStack = [...state.filterStack, { type: opt.type, value: opt.label }];
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
    return { filterStack: nextStack };
  })
}));
