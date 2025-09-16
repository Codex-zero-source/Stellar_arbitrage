import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

const KpiCard = ({ title, value, variant = 'default' }) => {
  const getCardClasses = () => {
    const baseClasses = "relative overflow-hidden transition-all duration-300 hover:scale-105";
    
    switch (variant) {
      case 'brutal':
        return `${baseClasses} brutal-card p-3 sm:p-6`;
      case 'glass':
        return `${baseClasses} glass-card p-3 sm:p-6`;
      case 'hybrid':
      default:
        return `${baseClasses} brutal-glass p-3 sm:p-6`;
    }
  };

  const getTitleClasses = () => {
    const baseClasses = "font-black uppercase tracking-widest mb-1 sm:mb-2";
    
    switch (variant) {
      case 'brutal':
        return `${baseClasses} text-brutal-black text-xs sm:text-sm`;
      case 'glass':
        return `${baseClasses} text-white text-xs sm:text-sm text-glow`;
      case 'hybrid':
      default:
        return `${baseClasses} text-neon-cyan text-xs sm:text-sm text-glow`;
    }
  };

  const getValueClasses = () => {
    const baseClasses = "font-black";
    
    switch (variant) {
      case 'brutal':
        return `${baseClasses} text-brutal-black text-lg sm:text-2xl`;
      case 'glass':
        return `${baseClasses} text-white text-lg sm:text-2xl text-glow`;
      case 'hybrid':
      default:
        return `${baseClasses} text-neon-lime text-lg sm:text-2xl text-glow`;
    }
  };

  return (
    <Card className={getCardClasses()}>
      <CardHeader className="pb-1 sm:pb-2">
        <CardTitle className={getTitleClasses()}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <p className={getValueClasses()}>{value}</p>
        {variant === 'hybrid' && (
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-neon-magenta/5 pointer-events-none" />
        )}
      </CardContent>
    </Card>
  );
};

export default KpiCard;