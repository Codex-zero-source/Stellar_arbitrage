import React from 'react';
import { cn } from '../../lib/utils';

const Button = React.forwardRef(({ 
  className, 
  variant = 'default', 
  size = 'default', 
  children, 
  ...props 
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-300 active:scale-95 select-none relative overflow-hidden rounded-lg';
  
  const variants = {
    default: 'material-leather text-slate-100 hover:text-white shadow-lg hover:shadow-xl',
    primary: 'glass-button material-primary text-blue-100 hover:text-white shadow-lg hover:shadow-blue-500/25',
    secondary: 'material-metal text-slate-200 hover:text-white shadow-lg hover:shadow-slate-500/25',
    success: 'glass-button material-success text-emerald-100 hover:text-white shadow-lg hover:shadow-emerald-500/25',
    danger: 'bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-100 border border-red-400/30 hover:from-red-500/30 hover:to-red-600/30 hover:border-red-400/50 backdrop-blur-md',
    ghost: 'bg-transparent text-slate-300 border border-slate-400/30 hover:bg-slate-800/50 hover:text-white hover:border-slate-300/50 backdrop-blur-sm',
    glass: 'glass-button text-white/90 border border-white/20 hover:text-white hover:border-white/40 backdrop-blur-md'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    default: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-xl',
    xl: 'px-8 py-4 text-lg rounded-xl'
  };

  return (
    <button
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
    </button>
  );
});

Button.displayName = 'Button';

export default Button;