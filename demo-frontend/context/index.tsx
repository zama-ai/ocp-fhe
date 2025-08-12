'use client';

import { wagmiAdapter, projectId } from '@/config/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { sepolia } from '@reown/appkit/networks';
import React, { type ReactNode } from 'react';
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi';
import { SidebarProvider } from '@/components/ui/sidebar';

// Set up queryClient
const queryClient = new QueryClient();

if (!projectId) {
  throw new Error('Project ID is not defined');
}

// Set up metadata
const metadata = {
  name: 'appkit-example',
  description: 'AppKit Example',
  url: 'https://appkitexampleapp.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

// Create the modal
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [sepolia],
  defaultNetwork: sepolia,
  metadata: metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    swaps: false,
    onramp: false,
    send: false,
    receive: false,
    email: false,
    socials: false,
    history: false,
  },
  enableCoinbase: false,
});

function ContextProvider({
  children,
  cookiesString,
  cookies,
}: {
  children: ReactNode;
  cookiesString: string | null;
  cookies: [string, { name: string; value: string }][];
}) {
  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookiesString
  );
  const sidebarState =
    cookies.find(([name]) => name === 'sidebar_state')?.[1].value === 'true';

  return (
    <SidebarProvider defaultOpen={sidebarState}>
      <WagmiProvider
        config={wagmiAdapter.wagmiConfig as Config}
        initialState={initialState}
      >
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </SidebarProvider>
  );
}

export default ContextProvider;
