import React from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export default function Rating({ value, size = 'md', showValue = false }: RatingProps) {
  const getColor = (r: number) => {
    if (r >= 8) return 'text-success bg-success/10';
    if (r >= 5) return 'text-warning bg-warning/10';
    return 'text-danger bg-danger/10';
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'w-3 h-3';
      case 'lg': return 'w-6 h-6';
      default: return 'w-4 h-4';
    }
  };

  const colorClass = getColor(value);

  return (
    <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${showValue ? colorClass : ''}`}>
      <Star className={`${getIconSize()} ${showValue ? 'fill-current' : 'fill-warning text-warning'}`} />
      <span className="font-bold">{value}</span>
    </div>
  );
}