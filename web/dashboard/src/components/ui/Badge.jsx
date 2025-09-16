import React from 'react';
import { cn } from '../../lib/utils';

const Badge = React.forwardRef(({ 
  className, 
  variant = 'default', 
  size = 'default',
  children, 
  ...props 
}, ref) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full border transition-all duration-200 select-none';
  
  const variants = {
    default: 'bg-slate-700/50 text-slate-200 border-slate-600/50 backdrop-blur-sm',
    success: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30 backdrop-blur-sm',
    warning: 'bg-amber-500/20 text-amber-200 border-amber-400/30 backdrop-blur-sm',
    danger: 'bg-red-500/20 text-red-200 border-red-400/30 backdrop-blur-sm',
    info: 'bg-blue-500/20 text-blue-200 border-blue-400/30 backdrop-blur-sm',
    outline: 'bg-transparent text-slate-300 border-slate-400/50 hover:bg-slate-800/30',
    glass: 'glass-overlay text-white/90 border-white/20 backdrop-blur-md',
    primary: 'bg-blue-500/20 text-blue-200 border-blue-400/30 backdrop-blur-sm',
    secondary: 'bg-slate-600/20 text-slate-300 border-slate-500/30 backdrop-blur-sm'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    default: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm'
  };

  return (
    <div
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </div>
  );
});

Badge.displayName = 'Badge';

export { Badge };