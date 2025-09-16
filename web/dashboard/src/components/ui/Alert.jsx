import React from 'react';
import { cn } from '../../lib/utils';

const Alert = React.forwardRef(({ 
  className, 
  variant = 'default',
  children,
  ...props 
}, ref) => {
  const baseClasses = 'relative w-full border-4 p-4 font-bold uppercase tracking-wide';
  
  const variants = {
    default: 'bg-brutal-black border-neon-lime text-neon-lime',
    success: 'bg-brutal-black border-neon-lime text-neon-lime',
    warning: 'bg-brutal-black border-brutal-yellow text-brutal-yellow',
    danger: 'bg-brutal-black border-neon-magenta text-neon-magenta',
    info: 'bg-brutal-black border-neon-cyan text-neon-cyan',
    glass: 'glass-card border-neon-lime/50 text-neon-lime'
  };

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(baseClasses, variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
});

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-black text-sm tracking-widest', className)}
    {...props}
  />
));

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-xs leading-relaxed', className)}
    {...props}
  />
));

Alert.displayName = 'Alert';
AlertTitle.displayName = 'AlertTitle';
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };