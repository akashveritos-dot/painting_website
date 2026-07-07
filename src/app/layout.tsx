import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CustomCursor from '@/components/ui/custom-cursor';
import ActionFeedback from '@/components/ui/action-feedback';

export const metadata: Metadata = {
  title: 'Mithila Heritage Gallery | Premium Madhubani Paintings',
  description: 'Immersive collection of premium, hand-painted Madhubani (Mithila) art by master artisans. Discover Bharni, Kachni, and Godna styles on handmade paper.',
  keywords: 'Madhubani paintings, Mithila art, traditional Indian paintings, hand-painted art, premium home decor, heritage art, Bharni, Kachni',
  authors: [{ name: 'Mithila Heritage Gallery' }],
  openGraph: {
    title: 'Mithila Heritage Gallery | Premium Madhubani Paintings',
    description: 'Immersive collection of premium, hand-painted Madhubani (Mithila) art by master artisans.',
    type: 'website',
    locale: 'en_IN',
  },
  icons: {
    icon: '/icon madhubni-Photoroom.png',
    apple: '/icon madhubni-Photoroom.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen flex flex-col selection:bg-madhubani-mustard/30 selection:text-madhubani-terracotta"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {/* Immersive cursor interaction trail */}
          <CustomCursor />
          <ActionFeedback />
          
          {/* Header navigation bar */}
          <Navbar />
          
          {/* Page contents container */}
          <main className="flex-grow flex flex-col">
            {children}
          </main>
          
          {/* Museum footer */}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
