import React from 'react';
import { cn } from '../../lib/utils';

const Progress = React.forwardRef(({ 
  className, 
  value = 0, 
  max = 100,
  variant = 'default',
  size = 'default',
  showValue = false,
  ...props 
}, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const baseClasses = 'relative overflow-hidden border-4 border-brutal-black';
  
  const variants = {
    default: 'bg-brutal-gray',
    glass: 'glass-card border-neon-lime/50',
    success: 'bg-brutal-gray',
    warning: 'bg-brutal-gray',
    danger: 'bg-brutal-gray'
  };

  const fillVariants = {
    default: 'bg-neon-lime',
    glass: 'bg-gradient-to-r from-neon-lime/80 to-neon-cyan/80 backdrop-blur-sm',
    success: 'bg-neon-lime',
    warning: 'bg-brutal-yellow',
    danger: 'bg-neon-magenta'
  };

  const sizes = {
    sm: 'h-2',
    default: 'h-4',
    lg: 'h-6'
  };

  return (
    <div className="w-full">
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out border-r-4 border-brutal-black',
            fillVariants[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-black uppercase tracking-wide text-brutal-black">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

Progress.displayName = 'Progress';

export { Progress };