import React from 'react';
import { 
  Wind, Target, Hash, Circle, Scan, Triangle, 
  Scissors, Layers, Pen, Diamond, Maximize, Warehouse 
} from 'lucide-react';

export const getToolImage = (type) => {
  const t = (type || '').toUpperCase();
  if (t.includes('FRESA')) return '/tool-images/fresa.png';
  if (t.includes('PUNTA')) return '/tool-images/punta.png';
  if (t.includes('MASCHIO')) return '/tool-images/maschio.png';
  if (t.includes('ALESATORE')) return '/tool-images/alesatore.png';
  if (t.includes('TASTATORE')) return '/tool-images/tastatore.png';
  if (t.includes('SVASATORE')) return '/tool-images/alesatore.png';
  if (t.includes('SMUSSATORE')) return '/tool-images/alesatore.png';
  if (t.includes('LAMATORE')) return '/tool-images/fresa.png';
  if (t.includes('TRACCIATORE')) return '/tool-images/maschio.png';
  if (t.includes('INSERTO')) return '/tool-images/inserto.png';
  if (t.includes('SPACCAMASCHIO')) return '/tool-images/maschio.png';
  
  return '/tool-images/fresa.png';
};

export const getToolIconConfig = (type) => {
  const t = (type || '').toUpperCase();
  if (t.includes('FRESA')) return { icon: Wind, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' };
  if (t.includes('PUNTA')) return { icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
  if (t.includes('MASCHIO')) return { icon: Hash, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
  if (t.includes('ALESATORE')) return { icon: Circle, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
  if (t.includes('TASTATORE')) return { icon: Scan, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
  if (t.includes('SVASATORE')) return { icon: Triangle, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' };
  if (t.includes('SMUSSATORE')) return { icon: Scissors, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
  if (t.includes('INSERTO')) return { icon: Diamond, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
  
  return { icon: Warehouse, color: 'text-slate-400', bg: 'bg-slate-500/5', border: 'border-white/10' };
};

export const ToolIcon = ({ type, size = 24, className = "", mode = 'icon' }) => {
  if (mode === 'image') {
    const src = getToolImage(type);
    return (
      <div className={`relative overflow-hidden flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <img 
          src={src} 
          alt={type} 
          className="w-full h-full object-cover rounded-xl"
          onError={(e) => { e.target.src = '/tool-images/fresa.png'; }}
        />
      </div>
    );
  }

  const { icon: Icon, color, bg, border } = getToolIconConfig(type);
  return (
    <div className={`flex items-center justify-center rounded-lg border ${bg} ${border} ${className}`} style={{ width: size, height: size }}>
      <Icon size={size * 0.6} className={color} />
    </div>
  );
};
