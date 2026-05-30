const fs = require('fs');
const path = require('path');

const appJsxPath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(appJsxPath, 'utf8');

// Add Sidebar import
content = content.replace(
  "const SelectionDrawer = lazy(() => import('./components/layout/SelectionDrawer'));",
  "const SelectionDrawer = lazy(() => import('./components/layout/SelectionDrawer'));\nconst Sidebar = lazy(() => import('./components/layout/Sidebar'));"
);

// Add showSidebarMobile state
content = content.replace(
  "const [showSearchOverlay, setShowSearchOverlay] = useState(false);",
  "const [showSearchOverlay, setShowSearchOverlay] = useState(false);\n  const [showSidebarMobile, setShowSidebarMobile] = useState(false);"
);

// Update Header props
content = content.replace(
  /<Header[\s\S]*?\/>/,
  `<Header onOpenSidebar={() => setShowSidebarMobile(true)} />`
);

// Remove showUserMenu state since it's not used anymore in App.jsx
content = content.replace("const [showUserMenu, setShowUserMenu] = useState(false);\n", "");

// Modify the main wrapper
content = content.replace(
  /<div ref={mainRef} className="h-\[100dvh\] w-screen flex flex-col app-container relative overflow-hidden dark:text-slate-200 text-slate-800 custom-scrollbar">/g,
  `<div ref={mainRef} className="h-[100dvh] w-screen flex flex-row relative overflow-hidden bg-slate-50 dark:bg-slate-950 dark:text-slate-200 text-slate-800">\n      <Suspense fallback={null}>\n        <Sidebar \n          isMobile={isMobile} \n          isOpen={showSidebarMobile} \n          onClose={() => setShowSidebarMobile(false)}\n          currentUser={currentUser}\n          onLogout={() => setCurrentUser(null)}\n          setView={setView}\n          fetchHistory={fetchHistory}\n          setShowAddModal={setShowAddModal}\n          onOpenSearch={() => setShowSearchOverlay(true)}\n          setOpType={setOpType}\n        />\n      </Suspense>\n      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden app-container custom-scrollbar px-1 md:px-2">`
);

// Add the closing div for the new wrapper at the end of the return statement
content = content.replace(
  /<\/div>\n  \);\n}\n\nexport default App;/g,
  `    </div>\n    </div>\n  );\n}\n\nexport default App;`
);

// We need to move the Breadcrumbs to the top of the main view and simplify the command bar.
// Let's locate the Breadcrumbs section in the global command bar and move it above the main content (below Header).

const breadcrumbsCode = `
      {/* Top Controls: Breadcrumbs & Filters (Moved from bottom) */}
      <AnimatePresence>
        {filterStack.length > 0 && view === 'home' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full flex items-center justify-between px-2 pt-2 md:pt-3 z-[60]">
            <div className="flex items-center gap-2 min-w-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-[16px] border border-slate-200/50 dark:border-white/10 shadow-sm flex-1">
              <button onClick={() => { setFilterStack(prev => {
                  let nextStack = [...prev];
                  while (nextStack.length > 0) {
                    const popped = nextStack.pop();
                    if (!popped.skipped) break;
                  }
                  return nextStack;
                }); 
              }} className="p-1.5 glass-button rounded-full text-accent-orange hover:scale-110 flex-shrink-0"
              ><ArrowLeft size={isMobile ? 14 : 16} /></button>
              <div className="flex flex-col min-w-0 ml-1">
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-accent-orange opacity-80">Filtro Corrente</span>
                <h2 className="text-[10px] md:text-xs font-bold uppercase tracking-wide dark:text-white text-slate-900 truncate">
                   {breadcrumbText}
                </h2>
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-2">
              <button onClick={resetFilters} className="glass-button px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-accent-orange flex items-center gap-1.5 shadow-sm hover:shadow-accent-orange/20 border border-accent-orange/20">
                <X size={12} /> <span className="hidden sm:inline">Resetta Tutto</span>
              </button>
              {currentLevel < 3 && (
                <div className="flex bg-slate-200/50 dark:bg-slate-800/50 rounded-full p-0.5 md:p-1 border border-slate-300/30 dark:border-slate-700/30 shadow-inner">
                  <button type="button" onClick={() => setViewMode('grid')} className={\`cursor-pointer p-1.5 rounded-full transition-all \${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-accent-blue' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-400'}\`} title="Vista a Griglia">
                    <LayoutGrid size={14} />
                  </button>
                  <button type="button" onClick={() => setViewMode('dropdown')} className={\`cursor-pointer p-1.5 rounded-full transition-all \${viewMode === 'dropdown' ? 'bg-white dark:bg-slate-700 shadow-sm text-accent-blue' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-400'}\`} title="Vista ad Elenco">
                    <List size={14} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
`;

// Insert breadcrumbs right before <main className="flex-1 w-full ...
content = content.replace(
  /<main className="flex-1 w-full flex flex-col items-center justify-start relative mt-1 md:mt-1\.5 min-h-0 overflow-hidden">/,
  breadcrumbsCode + '\n      <main className="flex-1 w-full flex flex-col items-center justify-start relative mt-1 md:mt-1.5 min-h-0 overflow-hidden">'
);

// Now let's completely replace the global-command-bar with just the contextual bulk actions
const newCommandBar = `
      {/* Contextual Bulk Action Bar */}
      <AnimatePresence>
        {selectedToolsIds.length > 0 && view === 'home' && (
          <motion.div key="global-command-bar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full flex flex-col items-center px-2 md:px-4 z-[100] shrink-0 pt-2 pb-2 relative" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
                <div className="w-full max-w-2xl flex flex-col shrink-0 pointer-events-auto">
                  <div className="pointer-events-auto flex items-center justify-between w-full bg-white/80 dark:bg-slate-900/80 rounded-[20px] md:rounded-[24px] p-2 md:p-3 md:px-4 border border-accent-blue/30 dark:border-accent-blue/30 gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-xl transition-all duration-300 backdrop-blur-3xl backdrop-saturate-150">
                     <div className="flex items-center gap-2">
                        <div className="bg-accent-blue text-white font-black text-xs md:text-sm w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-inner">{selectedToolsIds.length}</div>
                        <span className="hidden sm:inline text-[10px] md:text-xs font-black uppercase tracking-[0.1em] dark:text-white text-slate-900">Selezionati</span>
                     </div>
                     <div className="flex flex-1 justify-center gap-2 px-2">
                        <button onClick={() => handleBulkAction('carico')} className="action-btn action-btn-carica py-1.5 px-3 md:py-2.5 md:px-5 rounded-[12px] md:rounded-[16px] flex items-center justify-center gap-1.5 group shadow-sm hover:shadow-emerald-500/20 text-[10px] md:text-sm flex-1">
                          <ArrowDown size={isMobile ? 14 : 16} className="group-hover:translate-y-1 transition-transform" />
                          <span className="font-black tracking-wider">DEPOSITA</span>
                        </button>
                        <button onClick={() => handleBulkAction('scarico')} className="action-btn action-btn-scarica py-1.5 px-3 md:py-2.5 md:px-5 rounded-[12px] md:rounded-[16px] flex items-center justify-center gap-1.5 group shadow-sm hover:shadow-rose-500/20 text-[10px] md:text-sm flex-1">
                          <ArrowUp size={isMobile ? 14 : 16} className="group-hover:-translate-y-1 transition-transform" />
                          <span className="font-black tracking-wider">PRELEVA</span>
                        </button>
                     </div>
                     <button onClick={() => setSelectedToolsIds([])} className="glass-button p-2 rounded-[12px] md:rounded-[16px] text-rose-400 hover:bg-rose-400/10 flex items-center justify-center shrink-0" title="Annulla Selezione">
                       <X size={16} />
                     </button>
                  </div>
                </div>
                <AnimatePresence>
                  {selectedToolsIds.length > 0 && (
                    <motion.button initial={{ opacity: 0, scale: 0.8, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8, x: 20 }}
                      onClick={() => setShowSelectionDrawer(true)} className="absolute right-6 -top-20 floating-badge-container z-[100] glass-panel bg-accent-blue/20 border-accent-blue/40 px-6 py-4 rounded-full flex items-center gap-4 group overflow-hidden shadow-lg hidden md:flex"
                    >
                      <div className="absolute inset-0 bg-accent-blue/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                      <div className="relative flex items-center gap-3"><span className="text-[10px] font-black uppercase tracking-[0.2em] dark:text-white text-slate-900">Gestisci Selezione Multipla</span></div>
                    </motion.button>
                  )}
                </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
`;

// Replace the old global command bar
const regexCommandBar = /<AnimatePresence>[\s\S]*?<motion\.div key="global-command-bar"[\s\S]*?<\/AnimatePresence>[\s\S]*?<\/motion\.div>[\s\S]*?<\/AnimatePresence>/;

if (regexCommandBar.test(content)) {
  content = content.replace(regexCommandBar, newCommandBar);
} else {
  console.log("Could not find the global command bar to replace using regex. Please review.");
}

fs.writeFileSync(appJsxPath, content, 'utf8');
console.log("App.jsx updated successfully.");
