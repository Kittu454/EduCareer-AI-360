import React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  color?: 'blue' | 'teal' | 'emerald' | 'amber' | 'rose';
  showLabel?: boolean;
  className?: string;
}

export function Progress({
  value,
  max = 100,
  color = 'blue',
  showLabel = false,
  className = '',
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const colors = {
    blue: 'bg-blue-600',
    teal: 'bg-teal-600',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-500',
    rose: 'bg-rose-600',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-600 mb-1">
          <span>Progress</span>
          <span className="font-semibold">{percentage}%</span>
        </div>
      )}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${colors[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
