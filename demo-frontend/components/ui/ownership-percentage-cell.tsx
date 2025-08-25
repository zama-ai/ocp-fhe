import React from 'react';
import { formatOwnershipPercentage } from '@/lib/utils/ownership';

interface OwnershipPercentageCellProps {
  percentage: number;
  canAccess: boolean;
  className?: string;
}

export function OwnershipPercentageCell({
  percentage,
  canAccess,
  className = '',
}: OwnershipPercentageCellProps) {
  if (!canAccess) {
    // User cannot access - show private state
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="tracking-widest select-none text-zinc-400">••••</span>
        <span className="text-xs text-zinc-400">Private</span>
      </div>
    );
  }

  // Show actual percentage
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-mono font-medium text-zinc-900">
        {formatOwnershipPercentage(percentage)}
      </span>
    </div>
  );
}
