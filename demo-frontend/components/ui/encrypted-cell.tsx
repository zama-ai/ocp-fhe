import React from 'react';
import { LockIcon, UnlockIcon } from 'lucide-react';

interface EncryptedCellProps {
  label: string;
  value: string;
  decrypted: boolean;
  onDecrypt: () => void;
  onHide: () => void;
  canDecrypt: boolean;
}

export function EncryptedCell({
  label,
  value,
  decrypted,
  onDecrypt,
  onHide,
  canDecrypt,
}: EncryptedCellProps) {
  return (
    <div className="flex items-center gap-2">
      {!decrypted ? (
        <div className="inline-flex items-center gap-2 text-zinc-600">
          <LockIcon className="h-4 w-4" aria-hidden />
          <span className="tracking-widest select-none">••••</span>
          {canDecrypt ? (
            <button
              onClick={onDecrypt}
              className="text-xs px-2 py-1 rounded-full border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 transition"
              title={`Decrypt ${label}`}
            >
              Decrypt
            </button>
          ) : (
            <span
              className="text-xs px-2 py-1 rounded-full text-zinc-400"
              title="You are not authorized to decrypt this field"
            >
              No access
            </span>
          )}
        </div>
      ) : (
        <div className="inline-flex items-center gap-2">
          <UnlockIcon className="h-4 w-4 text-emerald-600" aria-hidden />
          <span className="font-mono">{value}</span>
          <button
            onClick={onHide}
            className="text-xs px-2 py-1 rounded-full border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 transition"
            title={`Hide ${label}`}
          >
            Hide
          </button>
        </div>
      )}
    </div>
  );
}
