import React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(({ 
  className, 
  type = 'text',
  variant = 'default',
  size = 'default',
  ...props 
}, ref) => {
  const baseClasses = 'font-bold uppercase tracking-wide placeholder:text-brutal-gray placeholder:font-bold placeholder:uppercase focus:outline-none transition-all duration-200';
  
  const variants = {
    default: 'bg-brutal-black text-neon-lime border-4 border-neon-lime focus:border-brutal-yellow focus:text-brutal-yellow',
    glass: 'glass-card text-neon-lime border-4 border-neon-lime/50 focus:border-neon-lime focus:bg-neon-lime/10',
    cyan: 'bg-brutal-black text-neon-cyan border-4 border-neon-cyan focus:border-neon-lime focus:text-neon-lime',
    magenta: 'bg-brutal-black text-neon-magenta border-4 border-neon-magenta focus:border-neon-lime focus:text-neon-lime'
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    default: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  return (
    <input
      type={type}
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'text-xs sm:text-sm font-black uppercase tracking-widest text-neon-lime mb-2 block',
      className
    )}
    {...props}
  />
));

Input.displayName = 'Input';
Label.displayName = 'Label';

export { Input, Label };