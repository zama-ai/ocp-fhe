import React from 'react';
import { LockIcon, UnlockIcon, Loader2Icon } from 'lucide-react';

interface EncryptedCellProps {
  label: string;
  value: string;
  decrypted: boolean;
  loading?: boolean;
  onDecrypt: () => void;
  onHide: () => void;
  canDecrypt: boolean;
  isPubliclyVisible?: boolean;
}

export function EncryptedCell({
  label,
  value,
  decrypted,
  loading = false,
  onDecrypt,
  onHide,
  canDecrypt,
  isPubliclyVisible = false,
}: EncryptedCellProps) {
  // If publicly visible, show the value directly without encryption UI
  if (isPubliclyVisible) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono">{value}</span>
        <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
          Public
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {!decrypted ? (
        <div className="inline-flex items-center gap-2 text-zinc-600">
          {loading ? (
            <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <LockIcon className="h-4 w-4" aria-hidden />
          )}
          <span className="tracking-widest select-none">••••</span>
          {canDecrypt ? (
            <button
              onClick={onDecrypt}
              disabled={loading}
              className="text-xs px-2 py-1 rounded-full border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              title={loading ? 'Decrypting...' : `Decrypt ${label}`}
            >
              {loading ? 'Decrypting...' : 'Decrypt'}
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
