import React from 'react';
import { Badge } from '@/components/ui/badge';

interface RoundPillsProps {
  rounds: string[];
  className?: string;
}

export function RoundPills({ rounds, className }: RoundPillsProps) {
  if (!rounds || rounds.length === 0) {
    return <span className="text-zinc-400 text-sm">No rounds</span>;
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className || ''}`}>
      {rounds.map((round, index) => (
        <Badge
          key={`${round}-${index}`}
          variant="secondary"
          className="text-xs px-2 py-1 bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
        >
          {round}
        </Badge>
      ))}
    </div>
  );
}
