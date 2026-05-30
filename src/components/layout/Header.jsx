import React, { memo, useState, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";

const TAGLINES = [
  'Fresa, Alesatore... cosa ti serve oggi?',
  'Attento al truciolo, morde più del capo!',
  'Se non misura giusto, pulisci il calibro!',
  'Un buon operatore non dà la colpa alla macchina',
  'Chi ha perso la chiave del mandrino?',
  'Misura due volte, taglia una sola!',
  'Siamo sicuri che il diametro sia quello giusto?',
  'Preleva, Lavora, Deposita... e non dimenticare il caffè!',
  'Tolleranza H7... o almeno ci proviamo!',
  'Il CNC non aspetta! Su i giri e dai gas!'
];

const MobileTagline = memo(({ text }) => {
  const containerRef = React.useRef(null);
  const textRef = React.useRef(null);
  const [scrollX, setScrollX] = useState(0);

  useLayoutEffect(() => {
    const calculateScroll = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const textWidth = textRef.current.scrollWidth;
        if (textWidth > containerWidth) {
          setScrollX(textWidth - containerWidth);
        } else {
          setScrollX(0);
        }
      }
    };

    calculateScroll();
    window.addEventListener('resize', calculateScroll);
    return () => window.removeEventListener('resize', calculateScroll);
  }, [text]);

  const duration = Math.max(6, scrollX * 0.07);

  return (
    <div ref={containerRef} className="overflow-hidden min-w-0 flex-1 relative flex items-center">
      <span
        ref={textRef}
        className={`text-[11px] font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase whitespace-nowrap inline-block ${
          scrollX > 0 ? 'animate-mobile-marquee' : ''
        }`}
        style={{
          '--scroll-x': `-${scrollX + 8}px`,
          '--marquee-duration': `${duration}s`
        }}
      >
        {text}
      </span>
    </div>
  );
});

const RotatingTagline = memo(() => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % TAGLINES.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden md:flex flex-1 justify-center items-center px-4 w-full">
      <div className="glass-panel rounded-full px-6 py-2.5 md:px-8 md:py-3 flex items-center gap-3 border border-slate-200/50 dark:border-slate-700/50 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-md hover:scale-[1.02] transition-transform duration-300">
        <Sparkles size={18} className="text-accent-orange animate-pulse shrink-0" />
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            className="overflow-hidden"
          >
            <p className="text-sm lg:text-base font-black tracking-[0.2em] text-slate-800 dark:text-slate-100 uppercase truncate">
              {TAGLINES[index]}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
});

const Header = memo(({ onOpenSidebar }) => {
  const [isHeaderMobile, setIsHeaderMobile] = useState(false);
  const [mobileTaglineIndex, setMobileTaglineIndex] = useState(0);

  useEffect(() => {
    const handleResize = () => setIsHeaderMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isHeaderMobile) return;
    
    const triggerInterval = setInterval(() => {
      setMobileTaglineIndex(prev => (prev + 1) % TAGLINES.length);
    }, 10000);

    return () => clearInterval(triggerInterval);
  }, [isHeaderMobile]);

  return (
    <div className="flex flex-col w-full z-50">
      {/* Transparent Header container, allowing taglines to float as independent capsules */}
      <header className="header-bar flex justify-between items-center py-1 px-1 bg-transparent border-0 shadow-none">
        
        {/* Mobile Menu Button (Left) */}
        <div className="md:hidden flex items-center justify-start shrink-0 mr-3">
           <Button variant="glass" size="icon" onClick={onOpenSidebar} className="w-10 h-10 rounded-[12px] bg-white/50 dark:bg-slate-800/50 shadow-sm border-slate-200/50 dark:border-slate-700/50 text-accent-blue">
              <Menu size={20} />
           </Button>
        </div>

        {/* Center: Taglines */}
        {isHeaderMobile ? (
           <div className="flex-1 min-w-0 flex items-center gap-2.5 overflow-hidden bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 rounded-full px-4 py-2.5 backdrop-blur-md shadow-sm">
              <Sparkles size={14} className="text-accent-orange animate-pulse shrink-0" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={mobileTaglineIndex}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="flex-1 min-w-0 flex items-center"
                >
                  <MobileTagline text={TAGLINES[mobileTaglineIndex]} />
                </motion.div>
              </AnimatePresence>
           </div>
        ) : (
           <RotatingTagline />
        )}
      </header>
    </div>
  );
});

export default Header;
