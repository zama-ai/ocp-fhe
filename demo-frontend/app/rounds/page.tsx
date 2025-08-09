'use client';

import * as React from 'react';
import { useAccount } from 'wagmi';
import { useRole } from '@/hooks/use-role';

export default function RoundsPage() {
  const { address: walletAddress } = useAccount();
  const { role: currentRole } = useRole();

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Main content area */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
          <h1 className="text-2xl font-semibold mb-4">
            Web3 Confidential Cap Table
          </h1>
          <p className="text-zinc-600 mb-6">
            This is the main application area. The top bar above demonstrates
            the sticky navigation with wallet chip and role selector
            functionality.
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-zinc-50 rounded-lg">
              <h3 className="font-medium mb-2">Current State:</h3>
              <ul className="text-sm text-zinc-600 space-y-1">
                <li>
                  <strong>Role:</strong> {currentRole}
                </li>
                {walletAddress ? (
                  <div>
                    <li>
                      <strong>Wallet:</strong> {walletAddress}
                    </li>
                    <li>
                      <strong>Short Address:</strong>{' '}
                      {`${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`}
                    </li>
                  </div>
                ) : (
                  <li>
                    <strong>Wallet:</strong> Not connected
                  </li>
                )}
              </ul>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">
                Features Demonstrated:
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>✓ Sticky top bar with backdrop blur</li>
                <li>
                  ✓ Building icon + &ldquo;Rounds &amp; Allocations&rdquo; title
                </li>
                <li>✓ Wallet chip showing shortened address</li>
                <li>✓ Role selector dropdown (FOUNDER | INVESTOR)</li>
                <li>✓ Responsive design with proper spacing</li>
                <li>✓ Clean shadcn/ui component integration</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
