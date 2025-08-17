import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import ContextProvider from '@/context';
import { headers } from 'next/headers';
import { Toaster } from '@/components/ui/sonner';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar-dynamic';
import { BreadcrumbNav } from '@/components/breadcrumb-nav';
import Script from 'next/script';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'OCP-FHE Demo',
  description:
    'Open Captable Protocol demo with Fully Homomorphic Encryption for confidential cap table management',
  icons: {
    icon: '/icon.svg',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookiesString = headersObj.get('cookie');

  return (
    <html lang="en">
      <head>
        <Script src="https://cdn.zama.ai/relayer-sdk-js/0.1.0-9/relayer-sdk-js.umd.cjs" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ContextProvider cookiesString={cookiesString}>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 px-4">
                {/* <SidebarTrigger className="-ml-1" /> */}
                <div className="flex items-center gap-2">
                  <BreadcrumbNav />
                </div>
              </header>
              <div>{children}</div>
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </ContextProvider>
      </body>
    </html>
  );
}
