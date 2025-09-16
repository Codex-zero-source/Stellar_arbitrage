import React from 'react';
import { cn } from '../../lib/utils';

const Card = React.forwardRef(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'skeu-glass text-slate-100 rounded-2xl',
    glass: 'glass-card text-slate-100 rounded-2xl border border-white/20',
    leather: 'material-leather text-slate-100 rounded-2xl',
    metal: 'material-metal text-slate-200 rounded-2xl',
    wood: 'material-wood text-amber-100 rounded-2xl',
    fabric: 'material-fabric text-slate-100 rounded-2xl',
    primary: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-400/30 text-blue-100 rounded-2xl backdrop-blur-md',
    success: 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-400/30 text-emerald-100 rounded-2xl backdrop-blur-md'
  };

  return (
    <div
      ref={ref}
      className={cn(variants[variant], 'shadow-lg hover:shadow-xl transition-all duration-300', className)}
      {...props}
    />
  );
});

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-2 p-6', className)}
    {...props}
  />
));

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'font-semibold text-lg leading-tight tracking-tight',
      className
    )}
    {...props}
  />
));

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm opacity-80 leading-relaxed', className)}
    {...props}
  />
));

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn('p-6 pt-0', className)} 
    {...props} 
  />
));

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardDescription.displayName = 'CardDescription';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };